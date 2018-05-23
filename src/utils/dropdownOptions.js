import _ from 'lodash'

import firstDefined from './firstDefined'

export const getOptionValue = props => (_.isNil(props.value) ? props.children : props.value)

export const getOptionLabel = props => firstDefined(props.label, getOptionValue(props))
