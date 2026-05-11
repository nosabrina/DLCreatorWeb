import { Router } from 'express';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { getDb, nowIso } from '../db/database.js';
import { writeAudit } from '../db/audit.js';
import { requireAuth } from '../middleware/auth.js';
import { hasPermission } from '../services/permissions-service.js';

export const libraryRouter = Router();
libraryRouter.use(requireAuth);

const listQuerySchema = z.object({
  domain: z.string().trim().max(120).optional(),
  theme: z.string().trim().max(250).optional(),
  subtheme: z.string().trim().max(250).optional(),
  publicTarget: z.string().trim().max(250).optional(),
  title: z.string().trim().max(250).optional(),
  author: z.string().trim().max(250).optional(),
  version: z.coerce.number().int().positive().optional(),
  validatedFrom: z.string().trim().max(40).optional(),
  validatedTo: z.string().trim().max(40).optional(),
  publishedFrom: z.string().trim().max(40).optional(),
  publishedTo: z.string().trim().max(40).optional(),
  q: z.string().trim().max(500).optional(),
  includeArchived: z.coerce.boolean().optional().default(false),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
  offset: z.coerce.number().int().min(0).optional().default(0)
});

function assertLibraryRead(req, res){
  if (hasPermission(req.user, 'library:read') || hasPermission(req.user, 'dl:readAll')) return true;
  writeAudit({ userId:req.user?.id || null, action:'library.access_denied', entityType:'library', entityId:null, newValue:{ path:req.originalUrl }, req });
  res.status(403).json({ error:'Droit insuffisant pour consulter la bibliothèque DL serveur.' });
  return false;
}

function isAdmin(user){ return user?.role === 'admin'; }

function rowToListDto(row){
  return {
    id: row.id,
    title: row.title,
    domain: row.domain,
    theme: row.theme,
    subtheme: row.subtheme,
    publicTarget: row.public_target,
    version: Number(row.version || 1),
    authorName: row.author_name || row.author_username || null,
    validatedAt: row.validated_at,
    publishedAt: row.published_at,
    archivedAt: row.archived_at || null,
    librarySummary: row.library_summary || null,
    libraryKeywords: row.library_keywords || null
  };
}

function rowToDetailDto(row){
  return {
    ...rowToListDto(row),
    ownerUserId: row.owner_user_id,
    publishedByUserId: row.published_by_user_id,
    publishedByName: row.publisher_name || null,
    status: row.status,
    jsonData: JSON.parse(row.json_data || '{}'),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function addLike(where, params, column, key, value){
  if (!value) return;
  where.push(`LOWER(${column}) LIKE @${key}`);
  params[key] = `%${String(value).toLowerCase()}%`;
}

function buildLibraryWhere(query, user){
  const includeArchivedForAdmin = query.includeArchived && isAdmin(user);
  const where = [includeArchivedForAdmin ? "(d.status = 'validated_library' OR (d.status = 'archived' AND d.published_at IS NOT NULL))" : "d.status = 'validated_library'", 'd.deleted_at IS NULL'];
  if (!includeArchivedForAdmin) where.push('COALESCE(d.library_visible, 1) = 1');
  const params = {};

  if (!includeArchivedForAdmin) where.push('d.archived_at IS NULL');

  addLike(where, params, 'd.domain', 'domain', query.domain);
  addLike(where, params, 'd.theme', 'theme', query.theme);
  addLike(where, params, 'd.subtheme', 'subtheme', query.subtheme);
  addLike(where, params, 'd.public_target', 'publicTarget', query.publicTarget);
  addLike(where, params, 'd.title', 'title', query.title);
  addLike(where, params, 'COALESCE(u.display_name,u.username)', 'author', query.author);

  if (query.version) { where.push('d.version = @version'); params.version = query.version; }
  if (query.validatedFrom) { where.push('d.validated_at >= @validatedFrom'); params.validatedFrom = query.validatedFrom; }
  if (query.validatedTo) { where.push('d.validated_at <= @validatedTo'); params.validatedTo = query.validatedTo; }
  if (query.publishedFrom) { where.push('d.published_at >= @publishedFrom'); params.publishedFrom = query.publishedFrom; }
  if (query.publishedTo) { where.push('d.published_at <= @publishedTo'); params.publishedTo = query.publishedTo; }

  if (query.q) {
    params.q = `%${String(query.q).toLowerCase()}%`;
    where.push(`(
      LOWER(d.title) LIKE @q OR LOWER(COALESCE(d.domain,'')) LIKE @q OR LOWER(COALESCE(d.theme,'')) LIKE @q OR
      LOWER(COALESCE(d.subtheme,'')) LIKE @q OR LOWER(COALESCE(d.public_target,'')) LIKE @q OR
      LOWER(COALESCE(d.library_summary,'')) LIKE @q OR LOWER(COALESCE(d.library_keywords,'')) LIKE @q OR
      LOWER(COALESCE(u.display_name,u.username,'')) LIKE @q
    )`);
  }

  return { whereSql: where.join(' AND '), params };
}

function insertLibraryEvent({ dlId = null, userId = null, eventType, metadata = null, req = null }){
  getDb().prepare(`INSERT INTO library_events (id,dl_id,user_id,event_type,metadata_json,ip_address,user_agent,created_at)
    VALUES (@id,@dlId,@userId,@eventType,@metadataJson,@ipAddress,@userAgent,@createdAt)`).run({
      id:nanoid(), dlId, userId, eventType,
      metadataJson: metadata == null ? null : JSON.stringify(metadata),
      ipAddress:req?.ip || null,
      userAgent:req?.headers?.['user-agent'] || null,
      createdAt:nowIso()
    });
}

const selectBase = `SELECT d.*, u.username AS author_username, u.display_name AS author_name, pub.display_name AS publisher_name
  FROM dl_documents d
  LEFT JOIN users u ON u.id = d.owner_user_id
  LEFT JOIN users pub ON pub.id = d.published_by_user_id`;

libraryRouter.get('/stats/new-count', (req, res, next) => {
  try{
    if (!assertLibraryRead(req, res)) return;
    const row = getDb().prepare(`SELECT COUNT(*) AS total
      FROM dl_documents d
      LEFT JOIN user_library_views v ON v.dl_id = d.id AND v.user_id = @userId
      WHERE d.status = 'validated_library'
        AND d.deleted_at IS NULL
        AND d.archived_at IS NULL
        AND COALESCE(d.library_visible, 1) = 1
        AND v.id IS NULL`).get({ userId:req.user.id });
    res.json({ count:Number(row?.total || 0) });
  }catch(err){ next(err); }
});

libraryRouter.get('/filters/options', (req, res, next) => {
  try{
    if (!assertLibraryRead(req, res)) return;
    const rows = getDb().prepare(`SELECT domain, theme, subtheme, public_target, version
      FROM dl_documents
      WHERE status = 'validated_library' AND deleted_at IS NULL AND archived_at IS NULL AND COALESCE(library_visible, 1) = 1`).all();
    const unique = key => Array.from(new Set(rows.map(r => r[key]).filter(Boolean))).sort((a,b) => String(a).localeCompare(String(b), 'fr'));
    res.json({
      domains: unique('domain'),
      themes: unique('theme'),
      subthemes: unique('subtheme'),
      publicTargets: unique('public_target'),
      versions: Array.from(new Set(rows.map(r => Number(r.version || 1)))).sort((a,b)=>a-b)
    });
  }catch(err){ next(err); }
});

libraryRouter.get('/', (req, res, next) => {
  try{
    if (!assertLibraryRead(req, res)) return;
    const query = listQuerySchema.parse(req.query || {});
    const { whereSql, params } = buildLibraryWhere(query, req.user);
    const totalRow = getDb().prepare(`SELECT COUNT(*) AS total FROM dl_documents d LEFT JOIN users u ON u.id = d.owner_user_id WHERE ${whereSql}`).get(params);
    const total = Number(totalRow?.total || 0);
    const items = getDb().prepare(`${selectBase} WHERE ${whereSql}
      ORDER BY COALESCE(d.published_at, d.validated_at, d.updated_at) DESC
      LIMIT @limit OFFSET @offset`).all({ ...params, limit:query.limit, offset:query.offset });
    const metadata = { filters:{ ...query, limit:undefined, offset:undefined }, limit:query.limit, offset:query.offset, total };
    writeAudit({ userId:req.user.id, action:query.q ? 'library.search' : 'library.list', entityType:'library', entityId:null, newValue:metadata, req });
    insertLibraryEvent({ userId:req.user.id, eventType:query.q ? 'library.search' : 'library.list', metadata, req });
    res.json({ items:items.map(rowToListDto), total, limit:query.limit, offset:query.offset });
  }catch(err){ next(err); }
});

libraryRouter.get('/:id', (req, res, next) => {
  try{
    if (!assertLibraryRead(req, res)) return;
    const includeArchived = req.query.includeArchived === 'true';
    const includeArchivedForAdmin = includeArchived && isAdmin(req.user);
    const where = ["d.id = @id", includeArchivedForAdmin ? "(d.status = 'validated_library' OR (d.status = 'archived' AND d.published_at IS NOT NULL))" : "d.status = 'validated_library'", 'd.deleted_at IS NULL'];
    if (!includeArchivedForAdmin) {
      where.push('COALESCE(d.library_visible, 1) = 1');
      where.push('d.archived_at IS NULL');
    }
    const row = getDb().prepare(`${selectBase} WHERE ${where.join(' AND ')}`).get({ id:req.params.id });
    if (!row) return res.status(404).json({ error:'DL bibliothèque introuvable ou non autorisée.' });
    writeAudit({ userId:req.user.id, action:'library.view', entityType:'dl_document', entityId:row.id, newValue:{ title:row.title }, req });
    insertLibraryEvent({ dlId:row.id, userId:req.user.id, eventType:'library.viewed', metadata:{ title:row.title }, req });
    res.json(rowToDetailDto(row));
  }catch(err){ next(err); }
});

libraryRouter.post('/:id/mark-viewed', (req, res, next) => {
  try{
    if (!assertLibraryRead(req, res)) return;
    const row = getDb().prepare(`SELECT id, title FROM dl_documents
      WHERE id = ? AND status = 'validated_library' AND deleted_at IS NULL AND archived_at IS NULL AND COALESCE(library_visible, 1) = 1`).get(req.params.id);
    if (!row) return res.status(404).json({ error:'DL bibliothèque introuvable ou non autorisée.' });
    const existing = getDb().prepare('SELECT id, first_viewed_at FROM user_library_views WHERE user_id = ? AND dl_id = ?').get(req.user.id, row.id);
    const ts = nowIso();
    if (existing) {
      getDb().prepare('UPDATE user_library_views SET last_viewed_at = ? WHERE id = ?').run(ts, existing.id);
    } else {
      getDb().prepare(`INSERT INTO user_library_views (id,user_id,dl_id,first_viewed_at,last_viewed_at)
        VALUES (@id,@userId,@dlId,@firstViewedAt,@lastViewedAt)`).run({ id:nanoid(), userId:req.user.id, dlId:row.id, firstViewedAt:ts, lastViewedAt:ts });
    }
    writeAudit({ userId:req.user.id, action:'library.mark_viewed', entityType:'dl_document', entityId:row.id, newValue:{ viewedAt:ts }, req });
    insertLibraryEvent({ dlId:row.id, userId:req.user.id, eventType:'library.viewed', metadata:{ markedViewedAt:ts }, req });
    res.json({ ok:true, id:row.id, viewedAt:ts });
  }catch(err){ next(err); }
});
