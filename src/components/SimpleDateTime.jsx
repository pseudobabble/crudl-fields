import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import cx from 'classnames'
import uniqid from 'uniqid'
import moment from 'moment'

import firstDefined from '../utils/firstDefined'
import { Button, Icon } from '../components'

const splitter = /[^\w]+/g
const trimFormat = format => format.replace(/^([^\w]+)|([^\w]+$)/g, '')
const splitFormat = format => trimFormat(format).split(splitter)

const getSplitStrings = (format) => {
    const f = trimFormat(format)
    const result = []
    let re = splitter.exec(f)
    while (re) {
        result.push(re[0].trim())
        re = splitter.exec(f)
    }
    return result
}

const getUnitName = (format) => {
    if (/Y/.test(format)) {
        return 'year'
    }
    if (/M/.test(format)) {
        return 'month'
    }
    if (/D/.test(format)) {
        return 'date'
    }
    if (/[Hh]/.test(format)) {
        return 'hour'
    }
    if (/m/.test(format)) {
        return 'minute'
    }
    if (/s/.test(format)) {
        return 'second'
    }
    return undefined
}

const getUnitClass = (unit) => {
    switch (unit) {
    case 'year':
    case 'month':
    case 'date':
        return 'date'
    default:
        return 'time'
    }
}

/** Utility function adds 'i' to 'v' in a modulo way on the [min, max) interval. */
const addmod = (v, i, min, max) => min + (((v - min) + i + (max - min)) % (max - min))

const roll = (m, unit, amount) => {
    const v = m.get(unit)
    if (unit === 'year') return v + amount
    if (unit === 'month') return addmod(v, amount, 0, 12)
    if (unit === 'date') return addmod(v, amount, 1, m.clone().add(1, 'month').date(0).date() + 1)
    if (unit === 'hour') return addmod(v, amount, 0, 24)
    if (unit === 'minute') return addmod(v, amount, 0, 60)
    if (unit === 'second') return addmod(v, amount, 0, 60)
    if (unit === 'millisecond') return addmod(v, amount, 0, 1000)
    throw new Error(`Unknown unit ${unit}`)
}

class DateTime extends React.Component {
    constructor(props) {
        super(props)
        this.id = firstDefined(props.id, uniqid())
        this.splitStrings = getSplitStrings(props.format)
        this.inputRefs = []
        this.state = this.determineState(props)
    }

    componentWillReceiveProps(newProps) {
        if (newProps.format !== this.props.format) {
            this.splitStrings = getSplitStrings(newProps.format)
        }
        this.setState(this.determineState(newProps))
    }

    setValue = (newValue) => {
        const isoOrNull = newValue ? newValue.toISOString() : null
        _.invoke(this.props, 'onChange', isoOrNull)
        if (_.isUndefined(this.props.value)) {
            this.setState({ value: newValue })
        }
    }

    getFormatSubstring = inputIndex => splitFormat(this.props.format)[inputIndex]

    getPlaceholder = inputIndex => this.getFormatSubstring(inputIndex)

    getInputValue = inputIndex => this.state.displayValue[inputIndex]

    getInputId = inputIndex => `${this.id}-${inputIndex}`

    hasUnit = unitName => (splitFormat(this.props.format).map(getUnitName).indexOf(unitName) >= 0)

    isDateOnly = () => !(
        this.hasUnit('hour') || this.hasUnit('minute') || this.hasUnit('second') || this.hasUnit('millisecond')
    )

    isTimeOnly = () => !(
        this.hasUnit('year') || this.hasUnit('month') || this.hasUnit('date')
    )

    isDisplayValueEmpty = () => this.state.displayValue.filter(v => v).length === 0

    displayValueToMoment = () => {
        const { displayValue } = this.state

        // If not all fields are filled out, return an invalid moment
        if (displayValue.filter(v => v).length !== displayValue.length) {
            return moment.invalid()
        }

        // Collect the value fragments and their format and translate that into a moment
        const dv = [] // Display value fragments
        const f = [] // Format substrings
        displayValue.forEach((v, i) => {
            dv.push(v)
            f.push(this.getFormatSubstring(i))
        })

        return moment.utc(dv.join(' '), f.join(' '), true)
    }

    determineState = (props) => {
        let displayValue = _.get(this.state, 'displayValue')

        const value = moment.utc(firstDefined(props.value, props.defaultValue))

        // If there's no display value or the value is different from
        // the display value, determine the new display value
        if (!displayValue || !value.isSame(this.displayValueToMoment())) {
            if (value.isValid()) {
                displayValue = splitFormat(value.format(props.format))
            } else {
                displayValue = _.fill(new Array(splitFormat(props.format).length), '')
            }
        }

        // If the value is not valid, store null
        return {
            value: value.isValid() ? value : null,
            displayValue,
        }
    }

    rollUnit = (inputIndex, amount) => {
        const value = this.displayValueToMoment()

        if (!value.isValid()) {
            this.setValue(moment.utc())
            return
        }

        const subFormat = this.getFormatSubstring(inputIndex)
        const unit = getUnitName(subFormat)

        const newValue = value.clone()
        newValue.set(unit, roll(value, unit, amount))

        this.setValue(newValue)
    }

    computeTabIndex = () => {
        if (this.props.disabled) return -1
        return firstDefined(this.props.tabIndex, -1)
    }

    handleChange = (e, index, inputValue) => {
        const { displayValue } = this.state

        const newDisplayValue = [
            ...displayValue.slice(0, index),
            inputValue.trim(),
            ...displayValue.slice(index + 1),
        ]

        this.setState({ displayValue: newDisplayValue })
        e.preventDefault()
    }

    handleKeyDown = (e, inputIndex) => {
        // Arrow up
        if (e.keyCode === 38) {
            this.rollUnit(inputIndex, 1)
            e.preventDefault()
        }
        // Arrow down
        if (e.keyCode === 40) {
            this.rollUnit(inputIndex, -1)
            e.preventDefault()
        }
        // Key left
        if (e.keyCode === 37 && e.target.selectionStart === 0) {
            // Focus the input on the left (modulo)
            this.inputRefs[((inputIndex - 1) + this.inputRefs.length) % this.inputRefs.length].focus()
            e.preventDefault()
        }
        // Key right
        if (e.keyCode === 39 && e.target.selectionStart === this.state.displayValue[inputIndex].length) {
            // Focus the input on the left (modulo)
            this.inputRefs[(inputIndex + 1) % this.inputRefs.length].focus()
            e.preventDefault()
        }
        // Escape: reset inputs
        if (e.keyCode === 27) {
            this.setState(this.determineState(this.props))
        }
    }

    handleInputBlur = (e) => {
        // If the display value is empty, clear the value
        if (this.isDisplayValueEmpty()) {
            this.handleClear()
            return
        }
        const m = this.displayValueToMoment()
        if (m.isValid()) {
            this.setState({ displayValue: splitFormat(m.format(this.props.format)) })
            if (!m.isSame(this.state.value)) {
                this.setValue(m)
            }
            _.invoke(this.props, 'onBlur', m)
        } else {
            _.invoke(this.props, 'onBlur', this.state.value)
        }
        if (e) {
            e.stopPropagation()
        }
    }

    handleClear = () => {
        this.setValue(null)
        this.setState({ displayValue: _.fill(new Array(splitFormat(this.props.format).length), '') })
    }

    handleNow = () => {
        this.setValue(moment.utc())
    }

    render() {
        const {
            className,
            withNowButton,
        } = this.props

        const { displayValue } = this.state

        const classes = cx('bubl-input bubl-datetime bubl-datetime_fragments', className, {
            'bubl-datetime_date-only': this.isDateOnly(),
            'bubl-datetime_time-only': this.isTimeOnly(),
        })

        const inputProps = (inputIndex) => {
            const formatSubstring = this.getFormatSubstring(inputIndex)
            const unit = getUnitName(formatSubstring)
            return {
                type: 'text',
                id: this.getInputId(inputIndex),
                placeholder: this.getPlaceholder(inputIndex),
                onChange: e => this.handleChange(e, inputIndex, e.target.value),
                value: this.getInputValue(inputIndex),
                key: this.getInputId(inputIndex),
                onBlur: this.handleInputBlur,
                onKeyDown: e => this.handleKeyDown(e, inputIndex),
                className: `${unit} ${formatSubstring}`,
                ref: (c) => { this.inputRefs[inputIndex] = c },
            }
        }

        const divProps = {
            tabIndex: this.computeTabIndex(),
            className: classes,
        }

        // Group date and time inputs under div-wrappers
        const groups = {}
        for (let i = 0; i < displayValue.length; i += 1) {
            const inputClass = getUnitClass(getUnitName(this.getFormatSubstring(i)))
            if (_.has(groups, inputClass)) {
                groups[inputClass].push(<input {...inputProps(i)} />)
            } else {
                groups[inputClass] = [<input {...inputProps(i)} />]
            }
            if (this.splitStrings[i]) {
                groups[inputClass].push(<span key={`split-${i}`} className="bubl-input__field-group-separator">{this.splitStrings[i]}</span>)
            }
        }

        return (
            <div {...divProps} >
                {_.map(groups, (inputGroup, inputClassName) => (
                    <div className={`bubl-input__field-group bubl-datetime__${inputClassName}`} key={inputClassName}>{inputGroup}</div>
                ))}
                {this.state.value &&
                    <Button className="bubl-button_clear" onClick={this.handleClear} tabIndex={-1} >
                        <Icon name="clear" />
                    </Button>
                }
                {withNowButton &&
                    <Button onClick={this.handleNow} tabIndex={-1} >
                        <Icon name={this.hasUnit('hour') ? 'now' : 'today'} />
                    </Button>
                }
            </div>
        )
    }
}

DateTime.propTypes = {
    value: PropTypes.string,
    defaultValue: PropTypes.string,
    className: PropTypes.string,
    children: PropTypes.node,
    disabled: PropTypes.bool,
    tabIndex: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    id: PropTypes.string,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    format: PropTypes.string,
    withNowButton: PropTypes.bool,
}

DateTime.defaultProps = {
    format: 'YYYY MMM DD HH mm',
    withNowButton: false,
}

export default DateTime
