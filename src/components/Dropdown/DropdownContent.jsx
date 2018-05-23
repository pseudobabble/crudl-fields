import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

const DropdownContent = (props) => {
    const className = cx('bubl-dropdown__content', props.className)
    return (
        <div className={className}>
            {props.children}
        </div>
    )
}

DropdownContent.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
}

export default DropdownContent
