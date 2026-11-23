import expect from "expect";
import { getConfiguredFields } from "../attributes";
import { canEditField, canEditLayer } from "../permissions";
import { getEditableFieldChanges, getEffectiveFormValues, initializeFormValues, isFieldConditionSatisfied } from "../conditionalFields";

const layer = {
    allowEditRoles: ["EDITOR"],
    fields: [
        { id: "champ1", type: "select", options: ["A", "B", "C"] },
        { id: "champ2", type: "select", visibleIf: { field: "champ1", eq: "A" }, options: ["FOO", "BAR"] },
        { id: "champ3", type: "text", visibleIf: { field: "champ2", eq: "FOO" }, defaultValue: "TOTO", required: true },
        { id: "champ4", type: "text", visibleIf: { field: "champ3", operator: "notEmpty" }, value: "BAZ", readOnly: true }
    ]
};
const attributes = { champ1: "A", champ2: "FOO", champ3: "", champ4: "" };
const roles = ["ROLE_EDITOR"];
const changes = (formValues, layerConfig = layer, userRoles = roles) => getEditableFieldChanges({
    locale: "fr-FR", selectedAttributes: attributes, formValues, layerConfig, userRoles
});

describe("Panel Editor conditional fields", () => {
    it("reuses list and text controls with id aliases and preserves tuple configurations", () => {
        const fields = getConfiguredFields(layer);
        expect(fields[0].name).toBe("champ1");
        expect(fields[0].type).toBe("list");
        expect(fields[2].type).toBe("string");
        expect(getConfiguredFields({ fields: [["legacy", "Legacy", "list", "true", "false", [], ["A"]]] })[0].editable).toBe(true);
    });

    it("initializes defaults and fixed values without replacing existing text or cleared input", () => {
        const initial = initializeFormValues(attributes, layer, roles);
        expect(initial.champ3).toBe("TOTO");
        expect(initial.champ4).toBe("BAZ");
        expect(initializeFormValues({ ...attributes, champ3: "Existing" }, layer, roles).champ3).toBe("Existing");
        expect(getEffectiveFormValues(attributes, { ...initial, champ3: "" }, layer, roles).champ3).toBe("");
        expect(getEffectiveFormValues(attributes, { ...initial, champ4: "tampered" }, layer, roles).champ4).toBe("BAZ");
    });

    it("disables all descendants when an ancestor stops matching despite retained values", () => {
        const values = initializeFormValues(attributes, layer, roles);
        expect(isFieldConditionSatisfied("champ4", values, layer)).toBe(true);
        expect(isFieldConditionSatisfied("champ3", { ...values, champ1: "B" }, layer)).toBe(false);
        expect(isFieldConditionSatisfied("champ4", { ...values, champ1: "B" }, layer)).toBe(false);
        expect(isFieldConditionSatisfied("champ4", { ...values, champ3: "  " }, layer)).toBe(false);
        expect(isFieldConditionSatisfied("champ4", { ...values, champ2: "BAR" }, layer)).toBe(false);
    });

    it("handles missing dependencies, unsupported operators and cycles without recursion errors", () => {
        const fields = [
            { name: "a", visibleIf: { field: "b", eq: "x" } },
            { name: "b", visibleIf: { field: "a", eq: "x" } },
            { name: "c", visibleIf: { field: "missing", operator: "notEmpty" } },
            { name: "d", visibleIf: { field: "champ1", operator: "unknown", eq: "A" } }
        ];
        ["a", "b", "c", "d"].forEach((name) => {
            expect(isFieldConditionSatisfied(name, { ...attributes, a: "x", b: "x", c: "", d: "" }, { fields })).toBe(false);
        });
    });

    it("resolves qualified attribute names and keeps zero and false nonempty", () => {
        const config = { fields: [
            { id: "child", visibleIf: { field: "parent", operator: "notEmpty" } }
        ] };
        expect(isFieldConditionSatisfied("child", { "ns:parent": 0, child: "" }, config)).toBe(true);
        expect(isFieldConditionSatisfied("child", { "ns:parent": false, child: "" }, config)).toBe(true);
    });

    it("excludes inactive changes and required checks from saving", () => {
        const result = changes({ champ1: "B", champ2: "BAR", champ3: "", champ4: "tampered" });
        expect(result.changedAttributes).toEqual({ champ1: "B" });
        expect(result.validationErrors).toEqual({});
        expect(Object.keys(changes({ ...attributes, champ3: "" }).validationErrors)).toEqual(["champ3"]);
    });

    it("saves active defaults and fixed readonly values, while enforcing readonly for admins", () => {
        const values = initializeFormValues(attributes, layer, roles);
        expect(changes(values).changedAttributes).toEqual({ champ3: "TOTO", champ4: "BAZ" });
        expect(canEditField(["ADMIN"], getConfiguredFields(layer)[3], "")).toBe(false);
        const readOnlyLayer = { fields: [{ name: "champ3", readOnly: true, required: true }] };
        expect(changes({ champ3: "tampered" }, readOnlyLayer, ["ADMIN"]).changedAttributes).toEqual({});
    });

    it("accepts editableIf while retaining visibleIf compatibility", () => {
        const config = { fields: [{ name: "champ2", editableIf: { field: "champ1", eq: "A" } }] };
        expect(isFieldConditionSatisfied("champ2", attributes, config)).toBe(true);
        expect(isFieldConditionSatisfied("champ2", { ...attributes, champ1: "B" }, config)).toBe(false);
    });

    it("requires all array conditions and handles shared dependencies", () => {
        const config = { fields: [
            ...layer.fields.filter((field) => field.id !== "champ4"),
            { name: "champ4", type: "string", editableIf: [
                { field: "champ2", eq: "FOO" }, { field: "champ3", eq: "BZH" }
            ] }
        ] };
        const values = { ...attributes, champ3: "BZH" };
        expect(isFieldConditionSatisfied("champ4", values, config)).toBe(true);
        expect(isFieldConditionSatisfied("champ4", { ...values, champ2: "BAR" }, config)).toBe(false);
        expect(isFieldConditionSatisfied("champ4", { ...values, champ3: "OTHER" }, config)).toBe(false);
        expect(isFieldConditionSatisfied("champ4", { ...values, champ1: "B" }, config)).toBe(false);
        expect(changes({ ...values, champ4: "edited" }, config).changedAttributes.champ4).toBe("edited");
        expect(changes({ ...values, champ3: "OTHER", champ4: "edited" }, config).changedAttributes.champ4).toBe(undefined);
    });

    it("combines equality and notEmpty with array conditions through the visibleIf alias", () => {
        const config = { fields: [{ name: "champ4", visibleIf: [
            { field: "champ2", eq: "FOO" }, { field: "champ3", operator: "notEmpty" }
        ] }] };
        expect(isFieldConditionSatisfied("champ4", { ...attributes, champ3: "BZH" }, config)).toBe(true);
        expect(isFieldConditionSatisfied("champ4", { ...attributes, champ3: "  " }, config)).toBe(false);
    });

    it("disables array conditions with missing dependencies, invalid entries or cycles", () => {
        [null, {}, { field: "missing", eq: "BZH" }, { field: "champ4", eq: "" }].forEach((entry) => {
            const config = { fields: [{ name: "champ4", editableIf: [
                { field: "champ2", eq: "FOO" }, entry
            ] }] };
            expect(isFieldConditionSatisfied("champ4", attributes, config)).toBe(false);
        });
    });

    it("treats an empty condition array as unrestricted", () => {
        expect(isFieldConditionSatisfied("champ4", attributes, {
            fields: [{ name: "champ4", editableIf: [] }]
        })).toBe(true);
    });

    it("respects layer and configured value role restrictions", () => {
        expect(canEditLayer(["VIEWER"], layer)).toBe(false);
        expect(initializeFormValues(attributes, layer, ["VIEWER"])).toEqual(attributes);
        expect(changes({ champ1: "B" }, layer, ["VIEWER"]).changedAttributes).toEqual({});
        const restricted = { fields: [{ name: "champ4", value: "BAZ", readOnly: true, roles: ["OTHER"] }] };
        expect(changes({ champ4: "tampered" }, restricted).changedAttributes).toEqual({});
    });
});
