import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

const Icon = (props) => {
    const className = cx('bubl-icon', `bubl-icon_${props.name}`, props.className)
    return (
        <div className={className} />
    )
}

Icon.propTypes = {
    /** Custom class */
    className: PropTypes.string,
    /** The icon's name */
    name: PropTypes.string.isRequired,
}

export default Icon
