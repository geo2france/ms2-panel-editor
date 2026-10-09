const isObject = (value) => !!value && typeof value === "object" && !Array.isArray(value);

const DEFAULT_FIELD_TYPE = "string";
const DEFAULT_AUTO_DATE_FORMAT = "YYYY-MM-DD";
const WFS_TO_INPUT_TYPE = {
    "xsd:int": "number",
    "xsd:integer": "number",
    "xsd:long": "number",
    "xsd:short": "number",
    "xsd:decimal": "number",
    "xsd:double": "number",
    "xsd:float": "number",
    "xsd:date": "date",
    "xsd:dateTime": "date"
};
const normalizeFieldKey = (fieldName = "") =>
    String(fieldName || "")
        .trim()
        .toLowerCase()
        // Remove optional namespace/table prefix (e.g. schema.field or ns:field).
        .replace(/^.*[.:]/, "");

const normalizeLayerConfig = (layerConfig = {}, layerName = "") => ({
    name: layerConfig?.name || layerName,
    ...layerConfig
});

const normalizeFieldOptions = (options) => {
    if (Array.isArray(options) || isObject(options)) {
        return options;
    }
    return [];
};

export const getLayersList = (pluginConfig = {}) => {
    const { layers } = pluginConfig || {};
    if (Array.isArray(layers)) {
        return layers.map((layer) => normalizeLayerConfig(layer, layer?.name));
    }
    if (isObject(layers)) {
        return Object.keys(layers).map((layerName) =>
            normalizeLayerConfig(layers[layerName], layerName)
        );
    }
    return [];
};

export const getLayerNameFromResponse = (response = {}) =>
    response?.layer?.name
    || response?.queryParams?.query_layers
    || response?.queryParams?.layers
    || "";

export const getLayerTitleFromResponse = (response = {}) =>
    response?.layerMetadata?.title || getLayerNameFromResponse(response);

const hasOwn = (objectValue = {}, key = "") =>
    Object.prototype.hasOwnProperty.call(objectValue, key);

const toDisplayValue = (value) =>
    value === null || value === undefined ? "" : String(value);

export const getFeatureOptionLabel = (feature = {}, pluginConfig = {}, featureIndex = 0) => {
    const featureProperties = isObject(feature?.properties) ? feature.properties : {};
    const configuredLabel = pluginConfig?.featureFielLabel || pluginConfig?.featureFieldLabel;
    const featureNumber = featureIndex + 1;
    const labelKey = configuredLabel || "id";

    let labelValue = "";
    if (configuredLabel) {
        labelValue = hasOwn(featureProperties, configuredLabel)
            ? toDisplayValue(featureProperties[configuredLabel])
            : "";
    } else if (hasOwn(featureProperties, "id")) {
        labelValue = toDisplayValue(featureProperties.id);
    } else if (feature?.id !== null && feature?.id !== undefined) {
        labelValue = toDisplayValue(feature.id);
    }

    const valueSuffix = labelValue ? ` ${labelValue}` : "";
    return `[${featureNumber}] - (${labelKey})${valueSuffix}`;
};

// Accept both compact tuple and object field definitions from config.
const normalizeFieldEntry = (fieldEntry = []) => {
    if (Array.isArray(fieldEntry)) {
        const [name, label, type, editable, required, roles, options] = fieldEntry;
        return {
            name,
            label: label || name,
            type: type || DEFAULT_FIELD_TYPE,
            editable: editable !== false,
            required: !!required,
            roles: Array.isArray(roles) ? roles : [],
            options: normalizeFieldOptions(options)
        };
    }

    if (isObject(fieldEntry)) {
        return {
            name: fieldEntry.name,
            label: fieldEntry.label || fieldEntry.name,
            type: fieldEntry.type || DEFAULT_FIELD_TYPE,
            editable: fieldEntry.editable !== false,
            required: !!fieldEntry.required,
            roles: Array.isArray(fieldEntry.roles) ? fieldEntry.roles : [],
            options: normalizeFieldOptions(fieldEntry.options)
        };
    }

    return null;
};

const normalizeAutoFieldEntry = (fieldEntry = []) => {
    if (Array.isArray(fieldEntry)) {
        const [name, type, sourceOrFormat, onSave] = fieldEntry;
        return {
            name,
            type: type || DEFAULT_FIELD_TYPE,
            source: sourceOrFormat,
            onSave: !!onSave,
            auto: true,
            editable: false
        };
    }

    if (isObject(fieldEntry)) {
        return {
            name: fieldEntry.name,
            type: fieldEntry.type || DEFAULT_FIELD_TYPE,
            source: fieldEntry.source || fieldEntry.format || fieldEntry.value,
            onSave: !!fieldEntry.onSave,
            auto: true,
            editable: false
        };
    }

    return null;
};

export const getConfiguredFields = (layerConfig = {}) => {
    const rawFields = Array.isArray(layerConfig?.fields) ? layerConfig.fields : [];
    return rawFields.map(normalizeFieldEntry).filter((entry) => !!entry?.name);
};

export const getConfiguredListFields = (layerConfig = {}) =>
    getConfiguredFields(layerConfig).filter((field) => field?.type === "list");

export const getAutoFields = (layerConfig = {}) => {
    const rawFields = Array.isArray(layerConfig?.auto) ? layerConfig.auto : [];
    return rawFields.map(normalizeAutoFieldEntry).filter((entry) => !!entry?.name);
};

export const getHiddenFields = (layerConfig = {}) =>
    Array.isArray(layerConfig?.hidden) ? layerConfig.hidden : [];

const inferFieldType = (value) => {
    if (typeof value === "number") {
        return "number";
    }
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return "date";
    }
    return DEFAULT_FIELD_TYPE;
};

const findConfiguredFieldByName = (fields = [], fieldName = "") => {
    const normalizedInputFieldName = normalizeFieldKey(fieldName);
    return fields.find((field) =>
        field.name === fieldName
        || normalizeFieldKey(field.name) === normalizedInputFieldName
    );
};

export const resolveAttributeName = (fieldName = "", attributes = {}) => {
    if (!fieldName) {
        return fieldName;
    }

    const attributeKeys = Object.keys(attributes || {});
    return attributeKeys.find((attributeKey) =>
        attributeKey === fieldName
        || normalizeFieldKey(attributeKey) === normalizeFieldKey(fieldName)
    ) || fieldName;
};

export const isRemoteListOptions = (options) =>
    isObject(options) && typeof options?.url === "string" && typeof options?.field === "string";

const normalizeOptionValue = (value) => {
    if (value === null || value === undefined) {
        return "";
    }
    return String(value);
};

export const normalizeSelectOptions = (options = []) => {
    const rawOptions = Array.isArray(options) ? options : [];
    const seenValues = new Set();

    return rawOptions.reduce((acc, option) => {
        if (option === null || option === undefined || option === "") {
            return acc;
        }

        const normalizedOption = isObject(option)
            ? option
            : { value: option, label: option };
        const normalizedValue = normalizeOptionValue(normalizedOption.value);

        if (!normalizedValue || seenValues.has(normalizedValue)) {
            return acc;
        }

        seenValues.add(normalizedValue);
        acc.push({
            value: normalizedOption.value,
            label: normalizedOption.label ?? normalizedOption.value
        });
        return acc;
    }, []);
};

export const getUniqueFieldValuesFromFeatures = (fieldName = "", features = []) => {
    if (!fieldName || !Array.isArray(features)) {
        return [];
    }

    const seenValues = new Set();
    return features.reduce((acc, feature = {}) => {
        const properties = feature?.properties || {};
        const attributeName = resolveAttributeName(fieldName, properties);
        const value = properties?.[attributeName];
        const normalizedValue = normalizeOptionValue(value);

        if (!normalizedValue || seenValues.has(normalizedValue)) {
            return acc;
        }

        seenValues.add(normalizedValue);
        acc.push(value);
        return acc;
    }, []);
};

const getDescribeFeatureProperties = (describeFeatureType = {}) =>
    Array.isArray(describeFeatureType?.featureTypes?.[0]?.properties)
        ? describeFeatureType.featureTypes[0].properties
        : [];

export const getDescribeFeatureProperty = (fieldName = "", describeFeatureType = {}) =>
    getDescribeFeatureProperties(describeFeatureType).find((property) =>
        property?.name === fieldName
        || normalizeFieldKey(property?.name) === normalizeFieldKey(fieldName)
    ) || null;

const buildFallbackFieldDefinition = (fieldName, fieldValue) => ({
    name: fieldName,
    label: fieldName,
    type: inferFieldType(fieldValue),
    editable: true,
    required: false,
    roles: [],
    options: []
});

export const resolveFieldDefinition = (fieldName, fieldValue, layerConfig = {}, describeFeatureType = null) => {
    const fields = getConfiguredFields(layerConfig);
    const autoFields = getAutoFields(layerConfig);
    const configuredField = findConfiguredFieldByName(fields, fieldName);
    const autoField = findConfiguredFieldByName(autoFields, fieldName);
    const describeProperty = getDescribeFeatureProperty(fieldName, describeFeatureType);
    const describeFieldType = WFS_TO_INPUT_TYPE[describeProperty?.type] || null;
    const baseDefinition = configuredField || {
        ...buildFallbackFieldDefinition(fieldName, fieldValue),
        type: describeFieldType || inferFieldType(fieldValue)
    };

    if (autoField || baseDefinition.type === "auto") {
        return {
            ...baseDefinition,
            ...autoField,
            label: baseDefinition.label || fieldName,
            type: autoField?.type || baseDefinition.type,
            editable: false,
            auto: true
        };
    }

    return baseDefinition;
};

export const getVisibleFieldNames = (attributes = {}, layerConfig = {}) => {
    const hiddenFields = getHiddenFields(layerConfig);
    return Object.keys(attributes).filter((fieldName) => !hiddenFields.includes(fieldName));
};

export const getEditableVisibleFieldNames = (attributes = {}, layerConfig = {}) => {
    const hiddenFields = getHiddenFields(layerConfig);
    const configuredFields = getConfiguredFields(layerConfig);
    const configuredHiddenFields = configuredFields
        .map((field) => resolveAttributeName(field.name, attributes))
        .filter((fieldName) => !!fieldName && hiddenFields.includes(fieldName));

    const visibleFields = getVisibleFieldNames(attributes, layerConfig);
    const orderedConfiguredHiddenFields = configuredHiddenFields.filter((fieldName, index, fieldNames) =>
        fieldNames.indexOf(fieldName) === index
    );

    return [...visibleFields, ...orderedConfiguredHiddenFields];
};

export const getWfsUrl = (pluginConfig = {}, layerConfig = {}) => {
    const explicitWfsUrl = layerConfig?.wfsUrl || pluginConfig?.wfsUrl;
    if (explicitWfsUrl) {
        return explicitWfsUrl;
    }

    const serverUrl = layerConfig?.serverUrl || pluginConfig?.serverUrl;
    if (!serverUrl) {
        return null;
    }

    const base = serverUrl.startsWith("http://") || serverUrl.startsWith("https://")
        ? serverUrl
        : `https://${serverUrl}`;
    const normalizedBase = base.replace(/\/+$/, "");

    // Normalize common geoserver base URL variants to a canonical WFS endpoint.
    if (/\/wfs$/i.test(normalizedBase)) {
        return normalizedBase;
    }
    if (/\/geoserver$/i.test(normalizedBase)) {
        return `${normalizedBase}/wfs`;
    }
    if (/\/geoserver\//i.test(normalizedBase)) {
        return `${normalizedBase}/wfs`;
    }
    return `${normalizedBase}/geoserver/wfs`;
};

export const guessDateFormat = (value = "") => {
    const normalizedValue = String(value || "").trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(normalizedValue)) {
        return "DD/MM/YYYY";
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
        return "YYYY-MM-DD";
    }
    return DEFAULT_AUTO_DATE_FORMAT;
};

export const formatDateValue = (value = new Date(), format = DEFAULT_AUTO_DATE_FORMAT) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const parts = {
        YYYY: String(date.getFullYear()),
        MM: String(date.getMonth() + 1).padStart(2, "0"),
        DD: String(date.getDate()).padStart(2, "0")
    };

    return String(format || DEFAULT_AUTO_DATE_FORMAT).replace(/YYYY|MM|DD/g, (token) => parts[token] || token);
};

const parseDateValue = (value) => {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    const normalizedValue = String(value || "").trim();
    if (!normalizedValue) {
        return null;
    }

    const isoDateMatch = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoDateMatch) {
        const [, year, month, day] = isoDateMatch;
        return new Date(Number(year), Number(month) - 1, Number(day));
    }

    const frenchDateMatch = normalizedValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (frenchDateMatch) {
        const [, day, month, year] = frenchDateMatch;
        return new Date(Number(year), Number(month) - 1, Number(day));
    }

    const parsedDate = new Date(normalizedValue);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const formatFieldDisplayValue = (value, fieldDefinition = {}) => {
    if (fieldDefinition?.type !== "date") {
        return toDisplayValue(value);
    }

    const parsedDate = parseDateValue(value);
    if (!parsedDate) {
        return toDisplayValue(value);
    }

    return formatDateValue(parsedDate, fieldDefinition?.source || guessDateFormat(value));
};
