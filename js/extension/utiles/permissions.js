const normalizeRoles = (roles) => {
    if (!roles) {
        return [];
    }
    return (Array.isArray(roles) ? roles : [roles]).filter(Boolean);
};
const normalizeRole = (role = "") => String(role).replace(/^ROLE_/, "");

export const isAdminRole = (userRoles) =>
    normalizeRoles(userRoles).some((userRole) => userRole === "ADMIN" || userRole === "ROLE_ADMIN");

export const isRoleAllowed = (userRoles, allowedRoles = []) => {
    if (isAdminRole(userRoles)) {
        return true;
    }
    const safeRoles = normalizeRoles(allowedRoles);
    if (!safeRoles.length) {
        return false;
    }
    const normalizedAllowedRoles = safeRoles.map(normalizeRole);

    return normalizeRoles(userRoles).some((userRole) => {
        const normalizedUserRole = normalizeRole(userRole);
        return safeRoles.includes("ALL")
            || safeRoles.includes(userRole)
            || safeRoles.includes(`ROLE_${normalizedUserRole}`)
            || normalizedAllowedRoles.includes(normalizedUserRole);
    });
};

export const canEditLayer = (userRoles, layerConfig = {}) => {
    if (layerConfig?.allowEdit === false) {
        return false;
    }
    const allowEditRoles = normalizeRoles(layerConfig?.allowEditRoles);
    if (allowEditRoles.length) {
        return isRoleAllowed(userRoles, allowEditRoles);
    }
    if (isAdminRole(userRoles)) {
        return true;
    }
    const editingRoles = layerConfig?.editingRoles || layerConfig?.edit || [];
    if (!editingRoles.length) {
        return true;
    }
    return isRoleAllowed(userRoles, editingRoles);
};

export const isDeleteEnabled = (layerConfig = {}) => layerConfig?.allowDelete === true;

export const canDeleteFeature = (userRoles, layerConfig = {}) => {
    if (isAdminRole(userRoles)) {
        return true;
    }
    const deletionRoles = layerConfig?.deletionRoles || layerConfig?.delete || layerConfig?.editingRoles || [];
    if (!deletionRoles.length) {
        return canEditLayer(userRoles, layerConfig);
    }
    return isRoleAllowed(userRoles, deletionRoles);
};

const isRequiredValueMissing = (value) =>
    value === null
    || value === undefined
    || (typeof value === "string" && value.trim() === "");

export const canEditField = (userRoles, fieldConfig = {}, currentValue) => {
    if (fieldConfig?.auto || fieldConfig?.type === "auto") {
        return false;
    }
    if (isAdminRole(userRoles)) {
        return true;
    }
    // Required fields with an empty value must stay editable to allow data completion.
    if (fieldConfig?.required && isRequiredValueMissing(currentValue)) {
        return true;
    }
    if (fieldConfig?.editable === false) {
        return false;
    }
    const fieldRoles = fieldConfig?.roles || [];
    if (!fieldRoles.length) {
        return true;
    }
    return isRoleAllowed(userRoles, fieldRoles);
};
