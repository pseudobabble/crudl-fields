import _ from 'lodash'

export default (...args) => _.find(args, value => !_.isUndefined(value))
