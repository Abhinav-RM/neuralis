export function validateBackupSchema(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    
    // Check core types
    if (typeof data.userName !== 'string') return false;
    if (typeof data.hasOnboarded !== 'boolean') return false;
    
    // Validate college structure if present
    if (data.college !== undefined) {
        if (!data.college || typeof data.college !== 'object') return false;
        if (data.college.assignments && !Array.isArray(data.college.assignments)) return false;
        if (data.college.exams && !Array.isArray(data.college.exams)) return false;
        if (data.college.attendance && typeof data.college.attendance !== 'object') return false;
        if (data.college.customNotifications && !Array.isArray(data.college.customNotifications)) return false;
    }
    
    // Validate customization structure if present
    if (data.customization !== undefined) {
        if (!data.customization || typeof data.customization !== 'object') return false;
        if (data.customization.uploadedSounds && !Array.isArray(data.customization.uploadedSounds)) return false;
        
        // Validate wallpaper string size & format if exists
        const bg = data.customization.backgroundImage;
        if (bg !== undefined && bg !== null) {
            if (typeof bg !== 'string') return false;
            if (!bg.startsWith('data:image/') || bg.length > 2 * 1024 * 1024) return false;
        }
    }
    
    return true;
}
