import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

const Error = ({ className, type, error }) => {
    const classes = classNames('bubl-error', className, {
        'bubl-error_non-form': type === 'non-form',
        'bubl-error_non-field': type === 'non-field',
        'bubl-error_field': type === 'field',
    })

    return (
        <div className={classes}>
            {error}
        </div>
    )
}

Error.propTypes = {
    className: PropTypes.string,
    type: PropTypes.string,
    error: PropTypes.node,
}

export default Error
