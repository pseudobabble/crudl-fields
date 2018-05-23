import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

const Help = ({ className, text, children }) => {
    const classes = cx('bubl-help', className)

    return (
        <div className={classes} >
            {children || text}
        </div>
    )
}

Help.propTypes = {
    className: PropTypes.string,
    text: PropTypes.string,
    children: PropTypes.node,
}
export default Help
