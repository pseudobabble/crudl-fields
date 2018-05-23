import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import _ from 'lodash'
import uniqid from 'uniqid'

import firstDefined from '../utils/firstDefined'

class Checkbox extends React.Component {
    constructor(props) {
        super(props)
        const { value, defaultChecked } = props
        this.state = {
            value: firstDefined(value, defaultChecked, false),
        }
        this.id = _.isUndefined(props.id) ? uniqid() : props.id
    }

    componentWillReceiveProps(newProps) {
        if (!_.isNil(newProps.value)) {
            this.setState({ value: newProps.value })
        }
    }

    setChecked = (value) => {
        _.invoke(this.props, 'onChange', value)
        if (_.isNil(this.props.value)) {
            this.setState({ value })
        }
    }

    handleClick = (e) => {
        this.setChecked(!this.state.value)
        _.invoke(this.props, 'onClick', e)
    }

    handleKeyDown = (e) => {
        // Check/uncheck with space
        if (e.keyCode === 32) {
            e.preventDefault()
            this.setChecked(!this.state.value)
        }
        _.invoke(this.props, 'onKeyDown', e)
    }

    render() {
        const className = cx('bubl-input bubl-checkbox', this.props.className, {
            'bubl-checkbox_checked': this.state.value,
            'bubl-switch': this.props.switch,
        })

        const { disabled, children, label } = this.props

        const divProps = {
            disabled,
            role: 'checkbox',
            'aria-checked': this.state.value,
            tabIndex: disabled ? -1 : 0,
            onClick: this.handleClick,
            onKeyDown: this.handleKeyDown,
            id: this.id,
        }

        let childElements = null

        if (!this.props.switch) {
            childElements = children || <label htmlFor={this.id}>{this.props.label}</label>
        }

        if (this.props.switch) {
            childElements = children || (
                <div className="bubl-switch__label">
                    <div className="bubl-switch__label-false">{this.props.switch.labelFalse || 'Off'}</div>
                    <div className="bubl-switch__label-true">{this.props.switch.labelTrue || 'On'}</div>
                </div>
            )
        }

        return (
            <div className={className} {...divProps}>
                {childElements}
            </div>
        )
    }
}

Checkbox.propTypes = {
    className: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.bool, PropTypes.string, PropTypes.number]),
    defaultChecked: PropTypes.bool,
    switch: PropTypes.oneOfType([PropTypes.bool, PropTypes.shape()]),
    tabIndex: PropTypes.number,
    disabled: PropTypes.bool,
    children: PropTypes.node,
    id: PropTypes.string,
    onClick: PropTypes.func,
}

export default Checkbox
