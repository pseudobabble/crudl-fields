import React, { cloneElement } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import _ from 'lodash'
import uniqid from 'uniqid'

import * as childrenUtils from '../utils/childrenUtils'
import { partitionHTMLInputProps } from '../utils/htmlInputPropsUtils'

import { Icon, Label } from './index'

class Input extends React.Component {
    getHtmlInputProps = () => {
        const { disabled, type, tabIndex } = this.props

        const [htmlInputProps] = partitionHTMLInputProps(this.props)

        return {
            ...htmlInputProps,
            disabled,
            type,
            tabIndex: disabled ? (tabIndex || -1) : tabIndex,
            onChange: this.handleChange,
            ref: this.handleInputRef,
        }
    }

    handleChange = (e) => {
        _.invoke(this.props, 'onChange', e.target.value)
        e.stopPropagation()
    }

    handleInputRef = (c) => {
        this.inputRef = c
        _.invoke(this.props, 'inputRef', c)
    }

    handleDivRef = (c) => {
        _.invoke(this.props, 'divRef', c)
    }

    render() {
        const { children, className } = this.props

        const htmlInputProps = this.getHtmlInputProps()

        let classes = cx('bubl-input', className)

        let foundIcon = false
        let isIconBeforeInput = false
        const inputId = uniqid()

        // Render with children
        if (!childrenUtils.isNil(children)) {
            const childElements = childrenUtils.traverse(children, (child) => {
                let props

                // Found icon?
                if (child.type === Icon) {
                    foundIcon = true
                }

                // Set the for prop for a label child
                if (child.type === 'label' || (child.type === Label && Label.isNative(child))) {
                    props = { htmlFor: inputId, ...child.props }
                }

                // Amend input placeholder
                if (child.type === 'input' || child.type === 'textarea') {
                    // Determine icon position
                    isIconBeforeInput = foundIcon

                    // Set input id
                    if (!child.props.id) {
                        htmlInputProps.id = inputId
                    }

                    props = {
                        ...htmlInputProps,
                        ...child.props,
                    }
                }

                if (props) return cloneElement(child, props)
                return child
            })

            if (foundIcon) {
                classes = cx(classes, {
                    'bubl-input_icon-left': isIconBeforeInput,
                    'bubl-input_icon-right': !isIconBeforeInput,
                })
            }
            return <div className={classes} ref={this.handleDivRef} >{childElements}</div>
        }

        // Render shorthand
        return (
            <div className={classes} ref={this.handleDivRef} >
                {htmlInputProps.type === 'textarea'
                    ? <textarea {...htmlInputProps} />
                    : <input {...htmlInputProps} />
                }
            </div>
        )
    }
}

Input.propTypes = {
    disabled: PropTypes.bool,
    tabIndex: PropTypes.number,
    type: PropTypes.oneOf(['text', 'password', 'hidden', 'checkbox', 'radio', 'textarea']),
    children: PropTypes.node,
    className: PropTypes.string,
    onChange: PropTypes.func,
}

Input.defaultProps = {
    type: 'text',
}

export default Input
