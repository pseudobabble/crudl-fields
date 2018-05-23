import React, { cloneElement } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import _ from 'lodash'

import DropdownSelectedOptions from './DropdownSelectedOptions'
import DropdownSearch from './DropdownSearch'
import Button from '../Button'
import Icon from '../Icon'

import * as childrenUtils from '../../utils/childrenUtils'

class DropdownHeader extends React.Component {
    constructor(props) {
        super(props)
        this.isSimpleHeader = true
    }

    clearSearchQuery = () => {
        _.invoke(this.searchElement, 'clearQuery')
    }

    handleSearch = (value) => {
        _.invoke(this.props, 'onSearch', value)
    }

    handleClear = () => {
        _.invoke(this.props, 'onClear')
    }

    handleClearButtonClick = (e) => {
        e.stopPropagation()
        this.handleClear()
    }

    computeTabIndex = () => _.get(this.props, 'tabIndex', this.isSimpleHeader ? 0 : -1)

    render() {
        const {
            className,
            children,
            title,
            selectedOptions,
            onRemove,
            onSearch,
            onClear,
            onClick,
            multiple,
            ...rest
        } = this.props

        const classes = cx('bubl-dropdown__header', className)

        // Whether or not the title should be rendered
        let shouldRenderTitle = true

        const childElements = childrenUtils.traverse(children, (child) => {
            let props

            if (child.type === DropdownSelectedOptions) {
                shouldRenderTitle = _.get(selectedOptions, 'length', 0) === 0
                props = {
                    ...child.props,
                    inline: true,
                    items: selectedOptions,
                    onRemove,
                }
            }

            if (child.type === DropdownSearch) {
                shouldRenderTitle = false
                this.isSimpleHeader = false
                props = {
                    ...child.props,
                    selectedValue: multiple ? undefined : _.get(selectedOptions[0], 'label'),
                    placeholder: title,
                    onChange: this.handleSearch,
                    onSearch: this.handleSearch,
                    onClear: this.handleClear,
                    ref: (c) => { this.searchElement = c },
                }
            }

            if (props) return cloneElement(child, props)
            return child
        })

        const divProps = {
            ...rest,
            className: classes,
            role: 'button',
            tabIndex: this.computeTabIndex(),
        }

        return (
            <div {...divProps}>
                {shouldRenderTitle &&
                    // eslint-disable-next-line
                    <div className="bubl-dropdown__title" onClick={onClick}>
                        {title}
                        <div className="bubl-icon bubl-icon_arrow-down" />
                        {!multiple && selectedOptions.length === 1 && (
                            <Button
                                className="bubl-button_clear"
                                tabIndex="-1"
                                onClick={this.handleClearButtonClick}
                            >
                                <Icon name="clear" />
                            </Button>
                        )}
                    </div>
                }
                {childElements}
            </div>
        )
    }
}

DropdownHeader.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    title: PropTypes.node,
    tabIndex: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    selectedOptions: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.any.isRequired,
        label: PropTypes.node.isRequired,
    })),
    /** Triggered when an option is removed from selected options */
    onRemove: PropTypes.func,
    multiple: PropTypes.bool,
    onSearch: PropTypes.func,
    onClear: PropTypes.func,
    onClick: PropTypes.func,
}

export default DropdownHeader
