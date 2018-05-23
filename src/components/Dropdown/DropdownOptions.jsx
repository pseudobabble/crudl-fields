import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import * as childrenUtils from '../../utils/childrenUtils'

const DropdownOptions = (props) => {
    const className = cx('bubl-dropdown__options', props.className)
    return (
        <div className={className}>
            {childrenUtils.isNil(props.children) &&
                <div className="bubl-dropdown__options__no-results">
                    {props.messageNoResults}
                </div>
            }
            {props.children}
        </div>
    )
}

DropdownOptions.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    messageNoResults: PropTypes.node,
}

export default DropdownOptions
