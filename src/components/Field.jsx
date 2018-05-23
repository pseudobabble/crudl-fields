import React, { Component, createElement, cloneElement } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import Label from './Label'
import Input from './Input'
import Error from './Error'
import Help from './Help'

import * as childrenUtils from '../utils/childrenUtils'
import firstDefined from '../utils/firstDefined'
import isInputComponent from '../utils/isInputComponent'

class Field extends Component {
    render() {
        const {
            error,
            label,
            help,
            required,
            component,
            children,
            className,
            componentRef,
            ...rest
        } = this.props

        let classes = cx('bubl-field', className, {
            'bubl-field_error': error,
        })

        // Render with children
        if (!component && !childrenUtils.isNil(children)) {
            const childElements = childrenUtils.traverse(children, (child) => {
                let props = null

                // Amend label
                if (child.type === Label) {
                    props = { text: label, required, ...child.props }
                }

                // Amend help
                if (child.type === Help) {
                    props = { text: help, ...child.props }
                }

                // Amend error
                if (child.type === Error) {
                    props = { error, ...child.props }
                    // Amend field class
                    if (!error && child.props.error) {
                        classes = cx(classes, 'bubl-field_error')
                    }
                }

                // An input component
                if (isInputComponent(child.type)) {
                    props = { ...rest, ...child.props, ref: componentRef }
                }

                // Clone if required
                if (props) return cloneElement(child, props)
                return child
            })
            return <div className={classes}>{childElements}</div>
        }

        // Render shorthand
        return (
            <div className={classes}>
                {label && <Label>{label}</Label>}
                {createElement(firstDefined(component, Input), { ...rest, ref: componentRef }, children)}
                {error && <Error error={error} />}
                {help && <Help text={help} />}
            </div>
        )
    }
}

Field.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    error: PropTypes.node,
    help: PropTypes.node,
    label: PropTypes.string,
    required: PropTypes.bool,
    component: PropTypes.func,
    componentRef: PropTypes.func,
}

export default Field
