import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

const DropdownOptionGroupHeader = (props) => {
    const { children, label, className } = props

    const classes = cx('bubl-dropdown__option-group-header', className)

    return (
        <div className={classes} >
            {children || label }
        </div>
    )
}

DropdownOptionGroupHeader.propTypes = {
    /** The label for this option header */
    label: PropTypes.string,
    children: PropTypes.node,
    className: PropTypes.string,
}

export default DropdownOptionGroupHeader
