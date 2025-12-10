import { useMemo, useEffect, useState } from 'react';
import { useRequest, useFetch } from './useRequest';

export function useShelfManagement(bookId, user) {
    const { request } = useRequest();
    const [isCreatingShelves, setIsCreatingShelves] = useState(false);

    const shelvesPath = user
        ? `/data/shelves?where=_ownerId%3D%22${user._id}%22`
        : null;
    const { data: shelvesData, refetch: refetchShelves } = useFetch(
        shelvesPath,
        {
            headers: user?.accessToken
                ? { 'X-Authorization': user.accessToken }
                : {},
        },
    );
    const shelves = shelvesData?.[0] || null;

    // Create initial shelves if user doesn't have any
    useEffect(() => {
        const createInitialShelves = async () => {
            if (
                user &&
                shelvesData &&
                Array.isArray(shelvesData) &&
                shelvesData.length === 0 &&
                !isCreatingShelves
            ) {
                setIsCreatingShelves(true);
                try {
                    const headers = { 'X-Authorization': user.accessToken };
                    await request(
                        '/data/shelves',
                        'POST',
                        {
                            read: [],
                            currentlyReading: [],
                            'to-read': [],
                            favoriteBooks: [],
                            dnf: [],
                        },
                        headers,
                    );
                    refetchShelves?.();
                } catch (err) {
                    console.error('Failed to create initial shelves:', err);
                } finally {
                    setIsCreatingShelves(false);
                }
            }
        };

        createInitialShelves();
    }, [user, shelvesData, isCreatingShelves, request, refetchShelves]);

    const bookShelves = useMemo(() => {
        if (!shelves || !bookId) return [];
        const inShelves = [];
        const shelfMap = {
            currentlyReading: 'Currently Reading',
            'to-read': 'To Read',
            read: 'Read',
            favoriteBooks: 'Favorites',
            dnf: 'Did Not Finish',
        };

        Object.entries(shelfMap).forEach(([key, label]) => {
            if (shelves[key]?.includes(bookId)) {
                inShelves.push(label);
            }
        });

        return inShelves;
    }, [shelves, bookId]);

    const toggleShelf = async (shelfKey) => {
        if (!user?.accessToken || !shelves) return;

        try {
            const headers = { 'X-Authorization': user.accessToken };
            const currentShelf = shelves[shelfKey] || [];
            const bookInShelf = currentShelf.includes(bookId);

            const updatedShelves = { ...shelves };

            const exclusiveShelfGroup = ['currentlyReading', 'to-read', 'read'];
            const isExclusiveShelf = exclusiveShelfGroup.includes(shelfKey);

            if (!bookInShelf) {
                updatedShelves[shelfKey] = [...currentShelf, bookId];

                if (isExclusiveShelf) {
                    exclusiveShelfGroup.forEach((key) => {
                        if (
                            key !== shelfKey &&
                            updatedShelves[key]?.includes(bookId)
                        ) {
                            updatedShelves[key] = updatedShelves[key].filter(
                                (id) => id !== bookId,
                            );
                        }
                    });
                }
            } else {
                updatedShelves[shelfKey] = currentShelf.filter(
                    (id) => id !== bookId,
                );
            }

            await request(
                `/data/shelves/${shelves._id}`,
                'PUT',
                updatedShelves,
                headers,
            );

            refetchShelves?.();
        } catch (err) {
            console.error('Failed to update shelf:', err);
            alert('Failed to update shelf. Please try again.');
        }
    };

    const removeFromAllShelves = async () => {
        if (!user?.accessToken || !shelves) return;

        try {
            const headers = { 'X-Authorization': user.accessToken };
            const updatedShelves = { ...shelves };

            // Remove book from all shelves
            const shelfKeys = [
                'currentlyReading',
                'to-read',
                'read',
                'favoriteBooks',
                'dnf',
            ];
            shelfKeys.forEach((key) => {
                if (updatedShelves[key]?.includes(bookId)) {
                    updatedShelves[key] = updatedShelves[key].filter(
                        (id) => id !== bookId,
                    );
                }
            });

            await request(
                `/data/shelves/${shelves._id}`,
                'PUT',
                updatedShelves,
                headers,
            );

            refetchShelves?.();
        } catch (err) {
            console.error('Failed to remove from shelves:', err);
            alert('Failed to remove from shelves. Please try again.');
        }
    };

    return {
        shelves,
        bookShelves,
        toggleShelf,
        removeFromAllShelves,
        refetchShelves,
    };
}
