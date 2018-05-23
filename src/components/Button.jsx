import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

const Button = (props) => {
    const { children, name, className, ...rest } = props
    return (
        <button {...rest} className={cx('bubl-button', className)}>
            {props.children || props.name}
        </button>
    )
}

Button.propTypes = {
    /** Custom class */
    className: PropTypes.string,
    /** The type of the button (one of 'button', 'submit', or 'reset') */
    type: PropTypes.oneOf(['button', 'submit', 'reset']),
    /** The button's text if no children provided */
    name: PropTypes.string,
    /** Button may have children (e.g. an Icon) */
    children: PropTypes.node,
}

Button.defaultProps = {
    type: 'button',
}

export default Button
