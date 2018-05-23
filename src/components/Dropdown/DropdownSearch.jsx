import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import _ from 'lodash'

import * as childrenUtils from '../../utils/childrenUtils'
import Input from '../Input'
import Button from '../Button'
import Icon from '../Icon'

import firstDefined from '../../utils/firstDefined'

class DropdownSearch extends React.Component {
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

        if (this.props.selectedValue !== newProps.selectedValue) {
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
        _.invoke(this.props, 'onDropdownSearch', this.state.value)
    }

    handleKeyDown = (e) => {
        if (e.keyCode === 13) {
            this.handleSubmit(e)
        }
    }

    handleChange = (value) => {
        _.invoke(this.props, 'onChange', value)
        if (_.isNil(this.props.value)) {
            this.setState({ value })
        }
    }

    handleClick = () => {
        // Clear the value
        _.invoke(this.props, 'onClick')
        this.handleChange('')
    }

    handleActiveValueChanged = (props) => {
        if (props.selectedValue) {
            this.handleChange('')
        }
        this.inputRef.blur()
    }

    render() {
        const {
            children,
            inline,
            className,
            iconLeft,
            selectedValue,
            placeholder,
            ...rest
        } = this.props

        const classes = cx('bubl-input bubl-search', className, {
            'bubl-search_default': !inline,
            'bubl-search_inline': inline,
        })

        const inputProps = {
            ...rest,
            value: this.state.value,
            onChange: this.handleChange,
            onClick: this.handleClick,
            onKeyDown: this.handleKeyDown,
            placeholder: firstDefined(selectedValue, placeholder),
            inputRef: (c) => { this.inputRef = c },
        }

        let childElements = []

        //
        // Inline search field
        //

        const withClearButton = !inline || selectedValue

        if (inline) {
            const inputWithAnIcon = [
                // Icon on the left side
                iconLeft &&
                    <Icon key="1" name="search" />,
                // The input placeholder
                <input key="2" />,
                // Clear button
                withClearButton && selectedValue &&
                    <Button key="3" tabIndex="-1" className="bubl-button_clear" onClick={this.handleClear}><Icon name="clear" /></Button>,
                // Icon on the right side
                !iconLeft &&
                    <Icon key="4" name="search" />,
            ]

            // children for shorthand
            childElements = inputWithAnIcon

            // children for non-shorthand
            if (!childrenUtils.isNil(children)) {
                // Add an icon
                childElements = childrenUtils.traverse(children, (child) => {
                    if (child.type === 'input') return inputWithAnIcon
                    return child
                })
            }
        }

        //
        // Default search arrangment with clear and submit buttons
        //

        if (!inline) {
            const inputWithButtons = [
                // Input placehoder
                <input key="1" />,
                // Optional clear button
                withClearButton && selectedValue &&
                    <Button key="2" tabIndex="-1" className="bubl-button_clear" onClick={this.handleClear}><Icon name="clear" /></Button>,
                // DropdownSearch button
                <Button key="3" tabIndex="-1" onClick={this.handleSubmit}><Icon name="search" /></Button>,
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
        }

        return (
            <Input className={classes} {...inputProps} >
                {childElements}
            </Input>
        )
    }
}

DropdownSearch.propTypes = {
    inline: PropTypes.bool,
    className: PropTypes.string,
    children: PropTypes.node,
    iconLeft: PropTypes.bool,
    value: PropTypes.string,
    defaultValue: PropTypes.string,
    selectedValue: PropTypes.string,
    placeholder: PropTypes.string,
    /** If this search is not inline, onDropdownSearch will be invoked when a user
    * hits the enter key or click on the search button */
    onDropdownSearch: PropTypes.func,
    /** If this search is not inline, onClear will be invoked when a user
    * clicks on the clear button */
    onClear: PropTypes.func,
}

DropdownSearch.defaultProps = {
    inline: false,
    iconLeft: false,
}

export default DropdownSearch
