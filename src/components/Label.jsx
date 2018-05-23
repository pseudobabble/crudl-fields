import React, { Component } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

class Label extends Component {
    /** Returns true if element is a native label */
    static isNative = element => element.props.type !== 'custom'

    render() {
        // Construct classes
        const classes = cx('bubl-label', this.props.className, {
            'bubl-label_required': this.props.required,
            'bubl-label_custom': this.props.type === 'custom',
        })

        if (this.props.type === 'custom') {
            return (
                <div className={classes}>
                    {this.props.children || this.props.text}
                </div>
            )
        }
        return (
            <label htmlFor={this.props.htmlFor} className={classes}>
                {this.props.children || this.props.text}
            </label>
        )
    }
}

Label.propTypes = {
    /** Custom class */
    className: PropTypes.string,
    /** Is this a native or custom label */
    type: PropTypes.oneOf(['custom']),
    /** Is the associated field required? */
    required: PropTypes.bool,
    /** The label text (if no children are provided) */
    text: PropTypes.string,
    /** Input entanglement */
    htmlFor: PropTypes.string,
    /** Labels may have children components */
    children: PropTypes.node,
}

export default Label
