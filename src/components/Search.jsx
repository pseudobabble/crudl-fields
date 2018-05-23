import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import _ from 'lodash'

import * as childrenUtils from '../utils/childrenUtils'
import Input from './Input'
import Button from './Button'
import Icon from './Icon'

import firstDefined from '../utils/firstDefined'

class Search extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            value: firstDefined(props.value, props.activeValue, ''),
        }
    }

    componentWillReceiveProps(newProps) {
        if (this.props.value !== newProps.value) {
            this.setState({ value: newProps.value })
        }

        if (this.props.activeValue !== newProps.activeValue) {
            this.handleActiveValueChanged(newProps)
        }
    }

    //
    // Imperative interface
    //

    clearQuery = () => {
        this.handleChange('')
    }

    //
    // Handlers
    //

    handleClear = (e) => {
        e.stopPropagation()
        this.handleChange('')
        _.invoke(this.props, 'onClear', this.state.value)
    }

    handleSubmit = () => {
        if (this.state.value) {
            _.invoke(this.props, 'onSearch', this.state.value)
        } else {
            _.invoke(this.props, 'onClear', this.state.value)
        }
    }

    handleKeyDown = (e) => {
        if (e.keyCode === 13) {
            this.handleSubmit()
        }
    }

    handleChange = (value) => {
        _.invoke(this.props, 'onChange', value)
        if (_.isNil(this.props.value)) {
            this.setState({ value })
        }
    }

    handleActiveValueChanged = (props) => {
        this.setState({ value: props.activeValue || '' })
    }

    render() {
        const {
            children,
            className,
            activeValue,
            ...rest
        } = this.props


        const classes = cx('bubl-input bubl-search', className)

        const inputProps = {
            ...rest,
            value: this.state.value,
            onChange: this.handleChange,
            onKeyDown: this.handleKeyDown,
            inputRef: (c) => { this.inputRef = c },
        }

        let childElements = []

        const inputElements = [
            // The input placeholder
            <input key="1" />,
            // Clear button
            activeValue && (
                <Button key="2" tabIndex="-1" className="bubl-button_clear" onClick={this.handleClear}>
                    <Icon name="clear" />
                </Button>
            ),
            // Search button
            <Button key="3" tabIndex="-1" onClick={this.handleSubmit}>
                <Icon name="search" />
            </Button>,
        ]

        // children for shorthand
        childElements = inputElements

        // children for non-shorthand
        if (!childrenUtils.isNil(children)) {
            // Append clear and submit buttons after the  <input /> placeholder
            childElements = childrenUtils.traverse(children, (child) => {
                if (child.type === 'input') return inputElements
                return child
            })
        }

        return (
            <Input {...inputProps} className={classes} >
                {childElements}
            </Input>
        )
    }
}

Search.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    value: PropTypes.string,
    activeValue: PropTypes.string,
    placeholder: PropTypes.string,
    /** onSearch will be invoked when a user hits the enter key or click on the search button */
    onSearch: PropTypes.func,
    /** onClear will be invoked when a user clicks on the clear button */
    onClear: PropTypes.func,
}

export default Search
