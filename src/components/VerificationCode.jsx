import React, { cloneElement } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import cx from 'classnames'
import uniqid from 'uniqid'

import * as childrenUtils from '../utils/childrenUtils'
import firstDefined from '../utils/firstDefined'

class VerificationCode extends React.Component {
    constructor(props) {
        super(props)
        this.id = firstDefined(props.id, uniqid())
        this.state = this.determineState(props)
    }

    componentWillReceiveProps(newProps) {
        this.setState(this.determineState(newProps))
    }

    setValue = (newValue) => {
        _.invoke(this.props, 'onChange', newValue)
        this.trySetState({ value: newValue })
    }

    getPlaceholder = (inputIndex) => {
        const { placeholder } = this.props
        return firstDefined(_.castArray(placeholder)[inputIndex], placeholder)
    }

    getInputId = inputIndex => `${this.id}-${inputIndex}`

    trySetState = (state, callback) => {
        const newState = {}
        Object.keys(state).forEach((key) => {
            newState[key] = firstDefined(this.props[key], state[key])
        })
        this.setState(newState, callback)
    }

    determineState = (props) => {
        const state = { value: firstDefined(props.value, props.defaultValue) }
        const { children, length } = props


        if (state.value) return state

        state.value = []
        if (!childrenUtils.isNil(children)) {
            childrenUtils.traverse(children, (child) => {
                if (child.type === 'input') {
                    state.value.push('')
                }
            })
        } else {
            for (let i = 0; i < length; i += 1) {
                state.value.push('')
            }
        }

        return state
    }

    computeTabIndex = () => {
        if (this.props.disabled) return -1
        return firstDefined(this.props.tabIndex, -1)
    }

    handleChange = (e, index, inputValue) => {
        const { value } = this.state
        const newValue = [...value.slice(0, index), inputValue, ...value.slice(index + 1)]
        this.setValue(newValue)
        e.preventDefault()
    }

    handleInputBlur = (e) => {
        e.stopPropagation()
    }

    handleInputFocus = (e) => {
        e.stopPropagation()
    }

    render() {
        const {
            className,
            children,
            length,
            onChange,
            ...rest
        } = this.props

        const classes = cx('bubl-input bubl-verification-code', className)

        const inputProps = inputIndex => ({
            type: 'text',
            id: this.getInputId(inputIndex),
            placeholder: this.getPlaceholder(inputIndex),
            onChange: e => this.handleChange(e, inputIndex, e.target.value),
            value: firstDefined(this.state.value[inputIndex], ''),
            key: this.getInputId(inputIndex),
            onBlur: this.handleInputBlur,
            onFocus: this.handleInputFocus,
        })

        const divProps = {
            ...rest,
            tabIndex: this.computeTabIndex(),
            className: classes,
        }


        // Render with children
        if (!childrenUtils.isNil(children)) {
            let inputIndex = 0
            const childElements = childrenUtils.traverse(children, (child) => {
                let props

                if (child.type === 'input') {
                    props = inputProps(inputIndex)
                    inputIndex += 1
                }

                if (props) return cloneElement(child, props)
                return child
            })
            return <div {...divProps} >{childElements}</div>
        }

        // Render shorthand
        const allInputProps = []
        for (let i = 0; i < length; i += 1) {
            allInputProps.push(inputProps(i))
        }

        return (
            <div {...divProps} >
                {allInputProps.map(props => <input {...props} />)}
            </div>
        )
    }
}

VerificationCode.propTypes = {
    length: PropTypes.number,
    value: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    defaultValue: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    placeholder: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    className: PropTypes.string,
    children: PropTypes.node,
    disabled: PropTypes.bool,
    tabIndex: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    id: PropTypes.string,
    onChange: PropTypes.func,
}

VerificationCode.defaultProps = {
    length: 4,
}

export default VerificationCode
