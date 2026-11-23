import React from "react";
import PropTypes from "prop-types";
import { FormControl } from "react-bootstrap";
import moment from "moment";

const NATIVE_DATE_FORMAT = "YYYY-MM-DD";

/**
 * Date input backed by the native browser picker when editable.
 * @param {object} props Input props.
 * @param {string} [props.format="YYYY-MM-DD"] Moment format for value and onChange.
 * The browser locale controls the native picker's display format.
 * @returns {React.ReactElement} Date form control.
 */
const DateInputControl = ({ value, onChange, disabled, format }) => {
    const date = moment(value, format, true);
    return (
        <FormControl
            type="date"
            value={date.isValid() ? date.format(NATIVE_DATE_FORMAT) : ""}
            disabled={disabled}
            onChange={(event) => {
                const nextDate = moment(event.target.value, NATIVE_DATE_FORMAT, true);
                onChange(nextDate.isValid() ? nextDate.format(format) : "");
            }}
        />
    );
};

DateInputControl.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
    format: PropTypes.string
};

DateInputControl.defaultProps = {
    value: "",
    onChange: () => {},
    disabled: false,
    format: NATIVE_DATE_FORMAT
};

export default DateInputControl;
