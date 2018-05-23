import React, { cloneElement } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import _ from 'lodash'

import * as childrenUtils from '../../utils/childrenUtils'
import DropdownContent from './DropdownContent'
import DropdownHeader from './DropdownHeader'
import DropdownOptions from './DropdownOptions'
import DropdownOption from './DropdownOption'
import DropdownOptionGroupHeader from './DropdownOptionGroupHeader'
import DropdownSelectedOptions from './DropdownSelectedOptions'
import DropdownSearch from './DropdownSearch'

import Icon from '../Icon'

import firstDefined from '../../utils/firstDefined'
import { getOptionValue, getOptionLabel } from '../../utils/dropdownOptions'

class Dropdown extends React.Component {
    constructor(props) {
        super(props)
        this.state = this.determineState(props)
        this.optRefs = {}
        document.addEventListener('mousedown', this.handleMouseDown)
        document.addEventListener('mouseup', this.handleMouseUp)
    }

    componentWillReceiveProps(newProps) {
        const newState = this.determineState(newProps)
        this.setState(newState)
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleMouseDown)
        document.removeEventListener('mouseup', this.handleMouseUp)
    }

    //
    // State manipulations
    //

    setValue = (value) => {
        _.invoke(this.props, 'onChange', value)
        this.trySetState({
            value,
            shouldSelectOnBlur: false,
        })
    }

    trySetState = (state, callback) => {
        const newState = {}
        Object.keys(state).forEach((key) => {
            newState[key] = firstDefined(this.props[key], state[key])
        })
        this.setState(newState, callback)
    }


    determineState = (props) => {
        const {
            multiple,
            value,
            defaultValue,
        } = props

        const state = {
            value: multiple ? [] : undefined,
            selectedOptions: [],
            allValues: [],
            excludedBySearch: {},
        }

        const newValue = optValue => (multiple ? state.value.concat(optValue) : optValue)

        // Determine the state from options
        const checkOptionProps = (optProps) => {
            const optValue = getOptionValue(optProps)
            state.value = optProps.selected ? newValue(optValue) : state.value
            state.allValues = state.allValues.concat(optValue)
        }
        this.collectOptionProps(props).forEach(checkOptionProps)
        state.value = firstDefined(value, _.get(this.state, 'value'), defaultValue, state.value)

        return state
    }

    //
    // Behavior
    //

    isChecked = (value) => {
        if (this.props.multiple) {
            return _.includes(this.state.value, value)
        }
        return this.state.value === value
    }

    toggleOption = (value) => {
        if (this.isChecked(value)) {
            this.setValue(this.props.multiple
                ? _.without(this.state.value, value)
                : null,
            )
        } else {
            this.setValue(this.props.multiple
                ? this.state.value.concat(value)
                : value,
            )
        }
        // Collapse on change?
        if (firstDefined(this.props.collapseOnChange, !this.props.multiple)) {
            this.collapse()
        }
    }

    clear = () => this.setValue(this.props.multiple ? [] : null)

    check = value => (!this.isChecked(value) && this.toggleOption(value))

    uncheck = value => (this.isChecked(value) && this.toggleOption(value))

    expand = () => {
        this.trySetState({
            expanded: true,
            valueWithKeyboardFocus: this.state.allValues.filter(this.isOptionListed)[0],
        }, () => {
            if (this.state.expanded) {
                _.invoke(this.props, 'onExpand')
            }
        })
    }

    collapse = () => {
        this.trySetState({ expanded: false }, () => {
            if (!this.state.expanded) {
                _.invoke(this.props, 'onCollapse')
            }
        })
    }

    toggleExpanded = () => (this.state.expanded ? this.collapse() : this.expand())

    focus = () => {
        if (this.props.expandOnFocus) {
            this.expand()
        }
        this.setState({ focus: true })
        _.invoke(this.props, 'onFocus')
    }

    blur = () => {
        // clear search query
        _.invoke(this.headerElement, 'clearSearchQuery')
        // select on blur ?
        if (
            this.state.expanded &&
            this.state.shouldSelectOnBlur &&
            !_.isUndefined(this.state.valueWithKeyboardFocus)
        ) {
            this.check(this.state.valueWithKeyboardFocus)
        }
        // collapse
        this.collapse()
        // set focus to false
        this.setState({ focus: false })
        // invoke handler
        _.invoke(this.props, 'onBlur', this.state.value)
    }

    /** Code adapted from Semantic-UI-React */
    scrollOptionIntoView = (optionValue) => {
        if (!this.dropdownDiv) return
        const menu = this.dropdownDiv.querySelector('.bubl-dropdown__options')
        if (!menu) return
        const item = _.get(this.optRefs[optionValue], 'optionDiv')
        if (!item) return
        const isOutOfUpperView = item.offsetTop < menu.scrollTop
        // eslint-disable-next-line max-len
        const isOutOfLowerView = (item.offsetTop + item.clientHeight) > menu.scrollTop + menu.clientHeight

        if (isOutOfUpperView) {
            menu.scrollTop = item.offsetTop
        } else if (isOutOfLowerView) {
            menu.scrollTop = (item.offsetTop + item.clientHeight) - menu.clientHeight
        }
    }

    /** Returns an array of active option props */
    selectedOptions = () => {
        if (_.isNil(this.state.value)) return []
        const values = _.castArray(this.state.value)
        const selectedOptions = this.collectOptionProps(this.props)
            .filter(props => values.indexOf(getOptionValue(props)) >= 0)
            .map(props => ({
                value: getOptionValue(props),
                label: getOptionLabel(props),
            }))
        // Include also the values which were not found in the options
        _.difference(values.filter(x => x), selectedOptions.map(opt => opt.value))
        .forEach((notFoundValue) => {
            selectedOptions.push({
                value: notFoundValue,
                label: `${notFoundValue}`,
            })
        })
        return selectedOptions
    }


    // TODO: collectOptionProps could use cache for speed up
    collectOptionProps = (props) => {
        const { options, children } = props
        if (options.length > 0) return options
        const collectedProps = []
        childrenUtils.traverse(children, (child) => {
            if (child.type === DropdownOption) {
                collectedProps.push(child.props)
            }
            return child
        })
        return collectedProps
    }

    determineTitle = () => {
        const { multiple, title } = this.props
        if (multiple) return title
        return _.get(this.selectedOptions()[0], 'label', title)
    }

    isOptionListed = (value) => {
        const { excludedBySearch } = this.state
        const { multiple, listSelectedOptions } = this.props
        const listSelected = firstDefined(listSelectedOptions, !multiple)
        return !excludedBySearch[value] && (!this.isChecked(value) || listSelected)
    }

    noResults = () => _.size(this.state.excludedBySearch) === this.state.allValues.length

    //
    // Perpare components
    //

    computeTabIndex = () => {
        if (this.props.disabled) return -1
        return _.isNil(this.props.tabIndex) ? -1 : this.props.tabIndex
    }

    amendOptionProps = (opt) => {
        const value = getOptionValue(opt)
        return {
            ...opt,
            onClick: this.handleOptionClick,
            value,
            selected: this.isChecked(value),
            hasKeyboardFocus: this.state.focus && value === this.state.valueWithKeyboardFocus,
            ref: (c) => { this.optRefs[value] = c; _.invoke(opt, 'ref', c) },
        }
    }

    //
    // Handlers
    //

    handleMouseDown = (e) => {
        this.mouseDown = true
        const outside = !this.dropdownDiv.contains(e.target)
        if (this.state.focus && outside) {
            this.blur()
        }
    }

    handleMouseUp = () => {
        this.mouseDown = false
    }

    handleClick = () => {
        this.focus()
    }

    handleHeaderClick = (e) => {
        if (!this.state.focus) {
            this.focus()
        } else {
            this.toggleExpanded()
        }
        e.stopPropagation()
    }

    handleTabIn = () => {
        if (!this.mouseDown) {
            this.focus()
        }
    }

    handleTabOut = () => {
        if (!this.mouseDown) {
            this.blur()
        }
    }

    handleOptionClick = (e, props) => {
        e.stopPropagation()
        if (this.props.allowToggle) {
            this.toggleOption(props.value)
        } else {
            this.check(props.value)
        }
    }

    handleKeyDown = (e) => {
        // Arrow up or down?
        if (e.keyCode === 38 || e.keyCode === 40) {
            e.preventDefault()
            const { allValues, valueWithKeyboardFocus } = this.state
            // Get the filtered values
            const filteredValues = allValues.filter(this.isOptionListed)
            // Compute shift
            const shift = e.keyCode === 38 ? -1 : +1
            // Get the position of the focused option
            const pos = filteredValues.indexOf(valueWithKeyboardFocus)
            // Compute the next index value (modulo)
            const next = (filteredValues.length + pos + shift) % filteredValues.length
            // Scroll option into view
            if (this.props.scrolling) {
                this.scrollOptionIntoView(filteredValues[next])
            }
            if (!this.state.expanded) {
                this.expand()
            }
            this.setState({
                valueWithKeyboardFocus: filteredValues[next],
                shouldSelectOnBlur: this.props.selectOnBlur,
            })
        }
        // Enter?
        if (e.keyCode === 13) {
            if (this.state.expanded && this.state.valueWithKeyboardFocus) {
                e.preventDefault()
                _.invoke(this.headerElement, 'clearSearchQuery')
                if (this.props.allowToggle) {
                    this.toggleOption(this.state.valueWithKeyboardFocus)
                } else {
                    this.check(this.state.valueWithKeyboardFocus)
                }
            }
        }
        // Escape?
        if (e.keyCode === 27 && this.props.collapseOnEscape) {
            this.collapse()
        }
    }

    handleRemoveOption = (item) => {
        this.uncheck(item.value)
    }

    handleSearch = (query) => {
        if (query && this.state.focus) {
            this.expand()
        }

        const excludedBySearch = {}
        const re = new RegExp(_.escapeRegExp(query), 'i')

        this.collectOptionProps(this.props).forEach((props) => {
            if (!re.test(getOptionLabel(props))) {
                excludedBySearch[getOptionValue(props)] = true
            }
        })

        this.setState({ excludedBySearch })
    }

    handleClear = () => {
        this.clear()
        this.setState({ excludedBySearch: {} })
    }

    render() {
        const {
            children,
            multiple,
            scrolling,
            className,
            options,
            tabIndex,
            disabled,
            expanded,
            collapseOnEscape,
            expandOnFocus,
            title,
            selectedOptionsPosition,
            search,
            listSelectedOptions,
            messageNoResults,
            selectOnBlur,
            allowToggle,
            ...rest
        } = this.props

        const { value, focus } = this.state
        const hasSelectedOptions = multiple ? !_.isEmpty(value) : !(_.isNil(value) || value === '')
        let classes = cx('bubl-dropdown', className, {
            'bubl-dropdown_scrolling': scrolling,
            'bubl-dropdown_disabled': disabled,
            'bubl-dropdown_focus': focus,
            'bubl-dropdown_has-selected-options': hasSelectedOptions,
        })

        const divProps = {
            ...rest,
            ref: (c) => { this.dropdownDiv = c },
            tabIndex: this.computeTabIndex(),
            role: 'combobox',
            'aria-multiselectable': multiple,
            'aria-expanded': firstDefined(expanded, this.state.expanded) ? 'true' : 'false',
            onKeyDown: this.handleKeyDown,
            onFocus: this.handleTabIn,
            onBlur: this.handleTabOut,
            onClick: this.handleClick,
            disabled,
        }

        const headerProps = {
            onRemove: this.handleRemoveOption,
            onSearch: this.handleSearch,
            onClear: this.handleClear,
            selectedOptions: this.selectedOptions(),
            title: this.determineTitle(),
            onClick: this.handleHeaderClick,
            multiple,
            ref: (c) => { this.headerElement = c },
        }

        const selectedOptionsProps = {
            onRemove: this.handleRemoveOption,
            items: this.selectedOptions(),
        }

        // Render shorthand
        if (options.length > 0 || childrenUtils.isNil(children)) {
            // Amend the props
            const optionsProps = options.map((props, i) => ({
                key: `option-${i}`,
                ...this.amendOptionProps(props),
            }))

            classes = cx(classes, {
                'bubl-dropdown_has-selected-options-outside': hasSelectedOptions && selectedOptionsPosition !== 'inline',
                'bubl-dropdown_has-selected-options-inline': hasSelectedOptions && selectedOptionsPosition === 'inline',
            })

            return (
                <div {...divProps} className={classes}>
                    {multiple && selectedOptionsPosition === 'top' &&
                        <DropdownSelectedOptions {...selectedOptionsProps} />
                    }
                    <div className="bubl-dropdown__core">
                        <DropdownHeader {...headerProps} >
                            {multiple && selectedOptionsPosition === 'inline' &&
                                <DropdownSelectedOptions {...selectedOptionsProps} />
                            }
                            {multiple && !search && selectedOptionsPosition === 'inline' &&
                                <Icon name="arrow-down" />
                            }
                            {search && <DropdownSearch inline />}
                        </DropdownHeader>
                        <DropdownContent>
                            <DropdownOptions messageNoResults={messageNoResults}>
                                {optionsProps
                                    .filter(props => this.isOptionListed(props.value))
                                    .map(props => (<DropdownOption {...props} />))}
                            </DropdownOptions>
                        </DropdownContent>
                    </div>
                    {multiple && selectedOptionsPosition === 'bottom' &&
                        <DropdownSelectedOptions {...selectedOptionsProps} />
                    }
                </div>
            )
        }

        // Render with children
        let foundHeader = false
        let dropdownSelectedOptions
        let selectedOptionsTop = true
        const childElements = childrenUtils.traverse(children, (child) => {
            let props = null

            // Check whether there is a header provided - has implication for tabIndex
            if (child.type === DropdownHeader) {
                foundHeader = true
                props = { ...headerProps, ...child.props }
            }

            // If no results, return empty options
            if (child.type === DropdownOptions && this.noResults()) {
                return <DropdownOptions messageNoResults={messageNoResults} />
            }

            // Amend option props
            if (child.type === DropdownOption) {
                props = this.amendOptionProps(child.props)
                if (!this.isOptionListed(props.value)) return null
            }

            // Remove DropdownSelectedOptions from the component tree,
            // since it will be moved above the core div
            if (child.type === DropdownSelectedOptions) {
                dropdownSelectedOptions = child
                selectedOptionsTop = !foundHeader
                return null
            }

            // Clone if required
            if (props) return cloneElement(child, props, child.props.children)
            return child
        })

        if (dropdownSelectedOptions) {
            dropdownSelectedOptions = cloneElement(dropdownSelectedOptions, {
                ...dropdownSelectedOptions.props,
                ...selectedOptionsProps,
            })
        }

        // If no header provided and tabIndex not controlled, make the dropdown navigable
        const correctedTabIndex = foundHeader ? divProps.tabIndex : _.get(this.props, 'tabIndex', 0)

        classes = cx(classes, {
            'bubl-dropdown_has-selected-options-outside': !_.isNil(dropdownSelectedOptions),
        })

        return (
            <div {...divProps} tabIndex={correctedTabIndex} className={classes} >
                {selectedOptionsTop && dropdownSelectedOptions}
                <div className="bubl-dropdown__core">
                    {childElements}
                </div>
                {!selectedOptionsTop && dropdownSelectedOptions}
            </div>
        )
    }
}

Dropdown.propTypes = {
    className: PropTypes.string,
    multiple: PropTypes.bool,
    scrolling: PropTypes.bool,
    children: PropTypes.node,
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.any.isRequired,
        label: PropTypes.string,
    })),
    value: PropTypes.any,
    defaultValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
    tabIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    expanded: PropTypes.bool,

    /** Whether an option can be selected and deselected. Default false */
    allowToggle: PropTypes.bool,

    /** If true, the option with a keyboard focus will be selected on blur. Default value: true */
    selectOnBlur: PropTypes.bool,

    /** Invoked when the dropdown expands. Will not be invoked for the initial render */
    onExpand: PropTypes.func,

    /** Invoked when the dropdown collapses */
    onCollapse: PropTypes.func,

    /** Should dropdown collapse when a user hits ESC? Default value: `true` */
    collapseOnEscape: PropTypes.bool,

    /** Should the dropdown expand when it receives focus? Default value: `false` */
    expandOnFocus: PropTypes.bool,

    /** Should the dropdown collapse when an option is selected?
    By default, multiple selection dropdowns will remain open on change, whereas single
    selection dropdowns will close on change. */
    collapseOnChange: PropTypes.bool,

    /** The title of the header */
    title: PropTypes.node,

    /** Gives the positions of DropdownSelectedOptions. Allowed values
    are 'top', 'bottom', 'inline'. Applicable only if the dropdown is multiple and
    it is rendering a shorthand (i.e. no children provided). Default value: `inline` */
    selectedOptionsPosition: PropTypes.oneOf(['top', 'bottom', 'inline']),

    /** Whether it should have a search input in the header.
    Applies only to shorthand definition */
    search: PropTypes.bool,

    /** Whether to list the active options. By default, single select lists the active option,
    whereas multiselect does not. */
    listSelectedOptions: PropTypes.bool,

    /** Message (or a react element) to display when there are no search results.
    Applies only to dropdowns with a search field. */
    messageNoResults: PropTypes.node,
}

Dropdown.defaultProps = {
    multiple: false,
    scrolling: true,
    options: [],
    collapseOnEscape: true,
    expandOnFocus: true,
    selectOnBlur: true,
    allowToggle: false,
    selectedOptionsPosition: 'inline',
    messageNoResults: 'No results',
}

Dropdown.Content = DropdownContent
Dropdown.Header = DropdownHeader
Dropdown.Options = DropdownOptions
Dropdown.Option = DropdownOption
Dropdown.OptionHeader = DropdownOptionGroupHeader
Dropdown.Search = DropdownSearch

export default Dropdown
