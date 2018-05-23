import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

const DropdownOptionGroup = (props) => {
    const { children, label, className } = props

    const classes = cx('bubl-dropdown__option-group', className)

    return (
        <div className={classes} >
            {children || label }
        </div>
    )
}

DropdownOptionGroup.propTypes = {
    /** The label for this option header */
    label: PropTypes.string,
    children: PropTypes.node,
    className: PropTypes.string,
}

export default DropdownOptionGroup
