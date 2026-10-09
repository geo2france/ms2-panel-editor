import React from "react";
import PropTypes from "prop-types";
import { FormControl } from "react-bootstrap";

/**
 * Date input backed by the native browser picker when editable.
 * @param {object} props Input props.
 * @returns {React.ReactElement} Date form control.
 */
const DateInputControl = ({ value, onChange, disabled }) => (
    <FormControl
        type="date"
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
    />
);

DateInputControl.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func,
    disabled: PropTypes.bool
};

DateInputControl.defaultProps = {
    value: "",
    onChange: () => {},
    disabled: false
};

export default DateInputControl;
