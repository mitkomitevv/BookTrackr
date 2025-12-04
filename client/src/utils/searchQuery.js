export function buildWhereFromQ(q, fields = ['title']) {
    if (!q) return null;
    const escaped = String(q).replace(/"/g, '\\"');
    return fields.map(f => `${f} LIKE "${escaped}"`).join(' OR ');
}

export default buildWhereFromQ;
