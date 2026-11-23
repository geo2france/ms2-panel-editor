import { getConfiguredFields, getEditableVisibleFieldNames, resolveAttributeName, resolveFieldDefinition } from "./attributes";
import { canEditField, canEditLayer, isRoleAllowed } from "./permissions";
import { validateFieldValue } from "./fieldValidation";

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const isEmpty = (value) => value === null || value === undefined
    || (typeof value === "string" && value.trim() === "");

export const canUseConfiguredValue = (userRoles, field) =>
    !field.auto && field.type !== "auto" && field.editable !== false
    && (!field.roles?.length || isRoleAllowed(userRoles, field.roles));

// Defaults are applied once per editing session, so clearing an input stays possible.
export const initializeFormValues = (attributes = {}, layerConfig = {}, userRoles = []) => {
    const values = { ...attributes };
    if (!canEditLayer(userRoles, layerConfig)) {
        return values;
    }
    getConfiguredFields(layerConfig).forEach((field) => {
        const name = resolveAttributeName(field.name, attributes);
        if (!hasOwn(attributes, name)) {
            return;
        }
        if (hasOwn(field, "value") && canUseConfiguredValue(userRoles, field)) {
            values[name] = field.value;
        } else if (hasOwn(field, "defaultValue") && isEmpty(values[name])
            && canEditField(userRoles, field, attributes[name])) {
            values[name] = field.defaultValue;
        }
    });
    return values;
};

// Configured values cannot be replaced by changes to the client-side form state.
export const getEffectiveFormValues = (attributes = {}, formValues = {}, layerConfig = {}, userRoles = []) => {
    const values = { ...attributes, ...formValues };
    if (canEditLayer(userRoles, layerConfig)) {
        getConfiguredFields(layerConfig).forEach((field) => {
            const name = resolveAttributeName(field.name, attributes);
            if (hasOwn(attributes, name) && hasOwn(field, "value") && canUseConfiguredValue(userRoles, field)) {
                values[name] = field.value;
            }
        });
    }
    return values;
};

export const isFieldConditionSatisfied = (fieldName, values = {}, layerConfig = {}, visiting = new Set()) => {
    const name = resolveAttributeName(fieldName, values);
    if (!hasOwn(values, name) || visiting.has(name)) {
        return false;
    }
    const field = resolveFieldDefinition(name, values[name], layerConfig);
    const condition = field.editableIf || field.visibleIf;
    if (!condition) {
        return true;
    }
    const conditions = Array.isArray(condition) ? condition : [condition];
    const nextVisiting = new Set(visiting);
    nextVisiting.add(name);
    return conditions.every((entry) => {
        if (!entry?.field) {
            return false;
        }
        const dependency = resolveAttributeName(entry.field, values);
        if (!isFieldConditionSatisfied(dependency, values, layerConfig, nextVisiting)) {
            return false;
        }
        if (entry.operator === "notEmpty") {
            return !isEmpty(values[dependency]);
        }
        return (!entry.operator || entry.operator === "eq")
            && hasOwn(entry, "eq") && values[dependency] === entry.eq;
    });
};

export const getEditableFieldChanges = ({ locale, userRoles, selectedAttributes = {}, formValues = {},
    layerConfig = {}, describeFeatureType = null }) => {
    const values = getEffectiveFormValues(selectedAttributes, formValues, layerConfig, userRoles);
    const fields = canEditLayer(userRoles, layerConfig)
        ? getEditableVisibleFieldNames(selectedAttributes, layerConfig)
            .filter((name) => isFieldConditionSatisfied(name, values, layerConfig))
        : [];
    return fields.reduce((result, name) => {
        const field = resolveFieldDefinition(name, selectedAttributes[name], layerConfig, describeFeatureType);
        const configuredValueAllowed = hasOwn(field, "value") && canUseConfiguredValue(userRoles, field);
        if (!configuredValueAllowed && !canEditField(userRoles, field, selectedAttributes[name])) {
            return result;
        }
        const error = validateFieldValue(values[name], field, locale);
        if (error) {
            result.validationErrors[name] = error;
        } else if (values[name] !== selectedAttributes[name]) {
            result.changedAttributes[name] = values[name];
        }
        return result;
    }, { changedAttributes: {}, validationErrors: {} });
};
