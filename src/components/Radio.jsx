import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import _ from 'lodash'
import uniqid from 'uniqid'

import firstDefined from '../utils/firstDefined'

class Radio extends React.Component {
    constructor(props) {
        super(props)
        this.id = firstDefined(props.id, uniqid())
        this.state = {
            checked: firstDefined(props.checked, props.defaultChecked, false),
        }
    }

    componentWillReceiveProps(newProps) {
        if (newProps.checked !== this.state.checked) {
            this.setState({ checked: newProps.checked })
        }
    }

    isChecked = () => this.state.checked

    check = () => {
        if (!this.isChecked()) {
            _.invoke(this.props, 'onChange', firstDefined(this.props.value, 'on'))
            if (_.isNil(this.props.checked)) {
                this.setState({ checked: true })
            }
        }
    }

    handleClick = (e) => {
        _.invoke(this.props, 'onClick')
        this.check(e)
    }

    handleKeyDown = (e) => {
        // Check/uncheck with space
        if (e.keyCode === 32) {
            e.preventDefault()
            this.check(e)
        }
        _.invoke(this.props, 'onKeyDown')
    }

    render() {
        const className = cx('bubl-input bubl-radio', this.props.className, {
            'bubl-radio_checked': this.isChecked(),
        })

        const { disabled, tabIndex, ...rest } = this.props

        const props = {
            ...rest,
            disabled,
            role: 'radio',
            'aria-checked': this.isChecked(),
            tabIndex: disabled ? -1 : 0,
            onClick: this.handleClick,
            onChange: this.handleChange,
            onKeyDown: this.handleKeyDown,
            id: this.id,
        }

        return (
            <div className={className} {...props}>
                {this.props.children || <label htmlFor={this.id}>{this.props.label}</label>}
            </div>
        )
    }
}

Radio.propTypes = {
    className: PropTypes.string,
    label: PropTypes.string,
    tabIndex: PropTypes.number,
    disabled: PropTypes.bool,
    checked: PropTypes.bool,
    defaultChecked: PropTypes.bool,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    children: PropTypes.node,
    id: PropTypes.string,
}

export default Radio
