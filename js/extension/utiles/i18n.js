const TRANSLATIONS = {
    en: {
        panelTitle: "Attributes",
        sidebarTooltip: "Attributes",
        emptyState: "Click on the map to load feature attributes.",
        layerLabel: "Layer",
        featureLabel: "Feature",
        noFeatureLabel: "No feature",
        readModeTitle: "Read mode",
        editModeTitle: "Edit mode",
        switchToEdit: "Edit",
        noEditRights: "You do not have edit rights",
        outsideCompetenceArea: "This object is not in your area of competence",
        zoomToCompetenceArea: "Zoom to area of competence",
        save: "Save",
        cancel: "Cancel",
        "delete": "Delete",
        noAttributes: "No attributes available for this feature.",
        saveSuccess: "Attributes have been saved.",
        saveErrorMissingConfig: "WFS update configuration is missing for this layer.",
        saveErrorGeneric: "Unable to save attributes.",
        editRestrictedAreaDenied: "You are not allowed to edit this feature outside your area of competence.",
        requiredField: "Required field",
        saveValidationError: "Some fields are invalid. Please fix them before saving.",
        saveNoChanges: "No editable field has changed."
    },
    fr: {
        panelTitle: "Attributs",
        sidebarTooltip: "Attributs",
        emptyState: "Cliquez sur la carte pour charger les attributs d'une entité.",
        layerLabel: "Couche sélectionnée :",
        featureLabel: "Entité",
        noFeatureLabel: "Aucune entité",
        readModeTitle: "Mode lecture",
        editModeTitle: "Mode édition",
        switchToEdit: "Modifier",
        noEditRights: "Vous n'avez pas les droits d'édition",
        outsideCompetenceArea: "Cet objet n'est pas dans votre zone de compétence",
        zoomToCompetenceArea: "Zoomer sur l'aire de compétence",
        save: "Enregistrer",
        cancel: "Annuler",
        "delete": "Supprimer",
        noAttributes: "Aucun attribut disponible pour cette entité.",
        saveSuccess: "Les attributs ont été enregistrés.",
        saveErrorMissingConfig: "La configuration WFS de mise à jour est absente pour cette couche.",
        saveErrorGeneric: "Impossible d'enregistrer les attributs.",
        editRestrictedAreaDenied: "Vous n'êtes pas autorisé à modifier cette entité hors de votre zone de compétence.",
        requiredField: "Champ obligatoire",
        saveValidationError: "Certains champs sont invalides. Corrigez-les avant d'enregistrer.",
        saveNoChanges: "Aucun champ modifiable n'a été modifié."
    }
};

export const getLanguageFromLocale = (locale = "en-US") =>
    (locale || "en-US").toLowerCase().startsWith("fr") ? "fr" : "en";

export const t = (locale, key, fallback = "") => {
    const language = getLanguageFromLocale(locale);
    return TRANSLATIONS[language][key] || TRANSLATIONS.en[key] || fallback || key;
};
