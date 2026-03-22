export const getDateKey = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const getMonthName = (monthIndex: number) => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months[monthIndex];
};

export const isDateInactive = (date: Date, startDateStr: string | null): boolean => {
    if (!startDateStr) return false;
    const dateKey = getDateKey(date);
    return dateKey < startDateStr;
};

export const calculateBMI = (heightCm: number, weightKg: number): number => {
    if (heightCm <= 0 || weightKg <= 0) return 0;
    return weightKg / Math.pow(heightCm / 100, 2);
};