import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import _ from 'lodash'

import Button from '../Button'
import Icon from '../Icon'

class DropdownSelectedOptions extends React.Component {
    handleRemoveItem = (item) => {
        _.invoke(this.props, 'onRemove', item)
    }

    render() {
        const { inline, className, items, onRemove, ...rest } = this.props
        const classes = cx('bubl-dropdown__selected-options', className, {
            'bubl-dropdown__selected-options_display-inline': inline,
            'bubl-dropdown__selected-options_display-block': !inline,
        })
        return (
            <ul className={classes} {...rest} >
                {items.map(item => (
                    <li key={item.value}>
                        {item.label || item.value}
                        <Button
                            tabIndex={-1}
                            onClick={() => this.handleRemoveItem(item)}
                        >
                            <Icon name="clear" />
                        </Button>
                    </li>
                ))}
            </ul>
        )
    }
}

DropdownSelectedOptions.propTypes = {
    className: PropTypes.string,
    display: PropTypes.oneOf(['inline', 'block']),
    items: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.node,
    })),
    onRemove: PropTypes.func,
    inline: PropTypes.bool,
}

DropdownSelectedOptions.defaultProps = {
    items: [],
}

export default DropdownSelectedOptions
