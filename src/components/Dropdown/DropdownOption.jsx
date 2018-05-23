import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import _ from 'lodash'

class DropdownOption extends React.Component {
    render() {
        const className = cx('bubl-dropdown__option', this.props.className)

        const {
            hasKeyboardFocus,
            selected,
            children,
            label,
            value,
            ...rest
        } = this.props

        return (
            // eslint-disable-next-line jsx-a11y/interactive-supports-focus
            <div
                {...rest}
                role="option"
                aria-selected={hasKeyboardFocus}
                aria-checked={selected}
                className={className}
                onClick={e => _.invoke(this.props, 'onClick', e, this.props)}
                ref={(c) => { this.optionDiv = c }}
            >
                {children || label || value }
            </div>
        )
    }
}

DropdownOption.propTypes = {
    /** The value of this option */
    // value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
    value: PropTypes.any,
    /** The label for this option */
    label: PropTypes.string,
    hasKeyboardFocus: PropTypes.bool,
    selected: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string,
}

DropdownOption.defaultProps = {
    hasKeyboardFocus: false,
}

export default DropdownOption
