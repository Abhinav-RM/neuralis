export const getDeviceId = (): string => {
    if (typeof window === 'undefined') return '';
    let id = localStorage.getItem('neuralis_device_id');
    if (!id) {
        // Generate a clean 12-character alphanumeric UUID
        id = 'neu_' + Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8);
        localStorage.setItem('neuralis_device_id', id);
    }
    return id;
};
