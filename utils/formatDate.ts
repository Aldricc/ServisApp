export const formatShortDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString; // Return original if not a valid date
        }

        // Format to DD/MM/YYYY
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (error) {
        return dateString;
    }
};

// Format saat menyimpan tanggal ke storage — DD/MM/YYYY
export const formatDateForStorage = (): string => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
};
