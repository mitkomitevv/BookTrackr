import { useMemo } from 'react';
import buildWhereFromQ from '../utils/searchQuery';

export default function useSearchQuery(q, fields = ['title']) {
    return useMemo(() => buildWhereFromQ(q, fields), [q, fields]);
}
