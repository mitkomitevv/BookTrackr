import { useRef, useEffect, useState } from 'react';

export function useExpandable(content) {
    const [expanded, setExpanded] = useState(false);
    const [isLong, setIsLong] = useState(false);
    const contentRef = useRef(null);

    useEffect(() => {
        if (contentRef.current) {
            const el = contentRef.current;
            setIsLong(el.scrollHeight > el.clientHeight);
        }
    }, [content]);

    return {
        expanded,
        setExpanded,
        contentRef,
        isLong,
    };
}

export default useExpandable;
