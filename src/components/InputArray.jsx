import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import cx from 'classnames'
import uniqid from 'uniqid'

import * as childrenUtils from '../utils/childrenUtils'
import firstDefined from '../utils/firstDefined'
import { Button, Icon } from '../components'

class InputArray extends React.Component {
    constructor(props) {
        super(props)
        this.id = firstDefined(props.id, uniqid())
        this.state = this.determineState(props)
        this.setFocus = -1
        this.inputRefs = []
        this.inputIds = {}
    }

    componentWillReceiveProps(newProps) {
        this.setState(this.determineState(newProps))
    }

    componentDidUpdate() {
        if (this.setFocus >= 0) {
            try {
                this.inputRefs[this.setFocus].select()
                this.setFocus = -1
            } catch (e) {
                // Ignore this update
            }
        }
    }

    setValue = (newValue) => {
        _.invoke(this.props, 'onChange', newValue)
        if (_.isUndefined(this.props.value)) {
            this.setState({ value: newValue })
        }
    }

    getPlaceholder = (inputIndex) => {
        const { placeholder } = this.props
        if (_.isFunction(placeholder)) return placeholder(inputIndex)
        return placeholder
    }

    getInputId = (inputIndex) => {
        let id = this.inputIds[inputIndex]
        if (!id) {
            id = uniqid()
            this.inputIds[inputIndex] = id
        }
        return id
    }

    setInput = (inputIndex, newInputValue) => {
        this.setValue(_.set(this.state.value.slice(), inputIndex, newInputValue))
    }

    determineState = (props) => {
        const state = { value: firstDefined(props.value, props.defaultValue) }
        const { length } = props

        if (!state.value) {
            state.value = []
        }

        // Fill in the missing ones
        for (let i = state.value.length; i < length; i += 1) {
            state.value.push('')
        }

        return state
    }

    computeTabIndex = () => {
        if (this.props.disabled) return -1
        return firstDefined(this.props.tabIndex, -1)
    }

    addInput = (index, newValue) => {
        const value = newValue || this.state.value
        if (value.length < this.props.maxLength) {
            const pre = value.slice(0, index)
            const post = value.slice(index)
            this.setValue([...pre, '', ...post])
            return true
        }
        return false
    }

    removeInput = (index, newValue) => {
        const value = newValue || this.state.value
        if (value.length > this.props.minLength) {
            const pre = value.slice(0, index)
            const post = value.slice(index + 1)
            this.inputIds[index] = ''
            this.setValue([...pre, ...post])
            return true
        }
        return false
    }

    handleChange = (e, index, inputValue) => {
        const { value } = this.state
        const newValue = [...value.slice(0, index), inputValue, ...value.slice(index + 1)]
        this.setValue(newValue)
        // If something was added to the last input,
        // add a new input automatically
        if (index === newValue.length - 1 && value[index].length < inputValue.length) {
            this.addInput(index + 1, newValue)
        }
        // If the one but last input was cleared and the last input is empty,
        // remove the last input
        if (index === newValue.length - 2 && !inputValue && !newValue[newValue.length - 1]) {
            this.removeInput(index + 1, newValue)
        }
    }

    handleInputBlur = (e) => {
        _.invoke(this.props, 'onBlur', this.state.value)
        e.stopPropagation()
    }

    handleInputFocus = (e) => {
        e.stopPropagation()
    }

    handleInputClear = (inputIndex) => {
        // Try removing the input. If that's not possible, clear it
        if (!this.removeInput(inputIndex)) {
            this.setInput(inputIndex, '')
        }
    }

    handleKeyDown = (e, index) => {
        const { value } = this.state
        // Enter
        if (e.keyCode === 13) {
            // If the next input is empty focus it, otherwise add a new one
            if (value[index + 1] === '') {
                this.setFocus = index + 1
                this.forceUpdate()
            } else if (this.addInput(index + 1)) {
                this.setFocus = index + 1
            } else {
                _.invoke(this.props, 'onMaxLengthReached', this.props.maxLength, this.props)
            }
            e.preventDefault()
        }
        // Backspace
        if (e.keyCode === 8 && value[index] === '') {
            e.preventDefault()
            if (this.removeInput(index)) {
                this.setFocus = Math.max(0, index - 1)
            } else {
                _.invoke(this.props, 'onMinLengthReached', this.props.minLength, this.props)
            }
        }
        // Delete
        if (e.keyCode === 46 && value[index] === '') {
            e.preventDefault()
            // Remove the element if it's not the last element or
            // if the next element is empty
            if (index !== value.length - 1 || (index < value.length - 1 && !value[index + 1])) {
                this.setFocus = index
                if (!this.removeInput(index)) {
                    _.invoke(this.props, 'onMinLengthReached', this.props.minLength, this.props)
                }
            }
        }
        // Up arrow
        if (e.keyCode === 38) {
            this.setFocus = ((value.length + index) - 1) % value.length
            this.forceUpdate()
            e.preventDefault()
        }
        // Down arrow
        if (e.keyCode === 40) {
            this.setFocus = (index + 1) % value.length
            this.forceUpdate()
            e.preventDefault()
        }
    }

    renderInputArray = () => {
        // Generate input props
        const getInputProps = inputIndex => ({
            type: 'text',
            id: this.getInputId(inputIndex),
            placeholder: this.getPlaceholder(inputIndex),
            onChange: e => this.handleChange(e, inputIndex, e.target.value),
            value: firstDefined(this.state.value[inputIndex], ''),
            key: this.getInputId(inputIndex),
            onBlur: this.handleInputBlur,
            onFocus: this.handleInputFocus,
            onKeyDown: e => this.handleKeyDown(e, inputIndex),
            ref: (c) => { this.inputRefs[inputIndex] = c },
        })

        const inputs = []

        for (let i = 0; i < this.state.value.length; i += 1) {
            inputs.push((
                <div key={`line-num-${this.getInputId(i)}`} className="bubl-input__field-group">
                    <span className="bubl-label">{i + 1}</span>
                    <input {...getInputProps(i)} />
                    {this.state.value &&
                        <Button className="bubl-button_clear" onClick={() => this.handleInputClear(i)} tabIndex={-1} >
                            <Icon name="clear" />
                        </Button>
                    }
                </div>
            ))
        }

        return inputs
    }

    render() {
        const {
            className,
            children,
        } = this.props

        const classes = cx('bubl-input bubl-input-array', className)

        const divProps = {
            tabIndex: this.computeTabIndex(),
            className: classes,
        }


        // Render with children
        if (!childrenUtils.isNil(children)) {
            const childElements = childrenUtils.traverse(children, (child) => {
                if (child.type === 'input') return this.renderInputArray()
                return child
            })
            return <div {...divProps} >{childElements}</div>
        }

        // Render shorthand
        return <div {...divProps}>{this.renderInputArray()}</div>
    }
}

InputArray.propTypes = {
    length: PropTypes.number,
    minLength: PropTypes.number,
    maxLength: PropTypes.number,
    value: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    defaultValue: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    placeholder: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    className: PropTypes.string,
    children: PropTypes.node,
    disabled: PropTypes.bool,
    tabIndex: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    id: PropTypes.string,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    /** Will be called when an attempt to add a new item fails because of the max length limit.
    The onMaxLengthReached function gets two parameters: maxLength and props */
    onMaxLengthReached: PropTypes.func,
    /** Will be called when an attempt to remove an item fails because of the min length limit.
    The onMinLengthReached function gets two parameters: minLength and props */
    onMinLengthReached: PropTypes.func,
}

InputArray.defaultProps = {
    length: 1,
    minLength: 1,
    maxLength: 255,
}

export default InputArray
