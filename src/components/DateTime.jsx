import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import _ from 'lodash'
import moment from 'moment'

import * as childrenUtils from '../utils/childrenUtils'
import Input from './Input'
import Button from './Button'
import Icon from './Icon'

import firstDefined from '../utils/firstDefined'

class DateTime extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            value: firstDefined(props.value, props.defaultValue, ''),
        }
    }

    componentWillReceiveProps(newProps) {
        if (!_.isNil(newProps.value)) {
            this.setState({ value: newProps.value })
        }
    }

    formatDatetime = (value) => {
        const m = moment(value)
        if (m.isValid()) return m.format(this.props.format)
        return value
    }

    //
    // Handlers
    //

    handleChange = (value) => {
        _.invoke(this.props, 'onChange', value)
        if (_.isNil(this.props.value)) {
            this.setState({ value })
        }
    }

    handleNow = () => {
        this.handleChange(this.formatDatetime(new Date()))
    }

    render() {
        const {
            children,
            className,
            placeholder,
            ...rest
        } = this.props

        const classes = cx('bubl-input bubl-datetime', className)

        const inputProps = {
            ...rest,
            value: this.state.value,
            onChange: this.handleChange,
            placeholder,
            inputRef: (c) => { this.inputRef = c },
        }

        let childElements = []

        //
        // Default DateTime arrangment with now button
        //

        const inputWithButtons = [
            // Input placehoder
            <input key="1" />,
            // Now button
            <Button key="2" tabIndex="-1" onClick={this.handleNow}><Icon name="now" /></Button>,
        ]

        // children for shorthand
        childElements = inputWithButtons

        // children for non-shorthand
        if (!childrenUtils.isNil(children)) {
            // Append clear and submit buttons after the  <input /> placeholder
            childElements = childrenUtils.traverse(children, (child) => {
                if (child.type === 'input') return inputWithButtons
                return child
            })
        }

        return (
            <Input className={classes} {...inputProps} >
                {childElements}
            </Input>
        )
    }
}

DateTime.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    value: PropTypes.string,
    defaultValue: PropTypes.string,
    placeholder: PropTypes.string,
    format: PropTypes.string,
}

DateTime.defaultProps = {
    format: 'YYYY-MM-DD HH:mm',
}

export default DateTime
