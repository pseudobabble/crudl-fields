import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import _ from 'lodash'
import Dropzone from 'dropzone'
import objectHash from 'object-hash'
import * as childrenUtils from '../utils/childrenUtils'

const previewTemplate = `
<div class="dz-preview dz-file-preview">
    <div class="dz-image"><img data-dz-thumbnail /></div>
    <div class="dz-details">
        <div class="dz-size"><span data-dz-size></span></div>
        <div class="dz-filename"><span data-dz-name></span></div>
    </div>
    <div class="dz-progress"><span class="dz-upload" data-dz-uploadprogress></span></div>
    <div class="dz-error-message"><span data-dz-errormessage></span></div>
    <div class="dz-success-mark">
    </div>
    <div class="dz-error-mark"></div>
</div>
`

class FileUpload extends React.Component {
    constructor(props) {
        super(props)
        this.state = this.determineState(props.value)
    }

    componentDidMount() {
        if (!this.props.config.url && !this.props.eventHandlers.drop) {
            console.error('Neither url nor a "drop" eventHandler specified, the React-Dropzone component might misbehave.')
        }

        this.dropzone = new Dropzone(this.dz, {
            maxFiles: this.props.multiple ? null : 1,
            previewTemplate,
            ...this.props.config,
        })

        this.subscribe()
        this.state.files.forEach(file => this.addFileToDropzone(file))
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.value !== nextProps.value) {
            // Keep the state in sync with the value prop
            this.setState(this.determineState(nextProps.value))
        }
    }

    /**
    * 1) Update Dropzone options each time the component updates.
    * 2) Sync state files and dropzone files.
    */
    componentDidUpdate() {
        // 1)
        this.dropzone.options = { ...this.dropzone.options, ...this.props.config }

        // 2)
        const { files, fileIndex } = this.state
        const hashes = Object.keys(fileIndex)
        const uploadedFiles = this.dropzone.files.filter(file => file.status === 'success')
        const uploadedHashes = uploadedFiles.map(file => file.hash)

        // - Remove files
        uploadedFiles.forEach((file) => {
            if (hashes.indexOf(file.hash) < 0) {
                this.removeFileFromDropzone(file)
            }
        })
        // - Add missing files
        hashes.forEach((hash) => {
            if (uploadedHashes.indexOf(hash) < 0) {
                this.addFileToDropzone(files[fileIndex[hash]])
            }
        })
    }

    /**
    * Computes the new state based on files
    */
    determineState = (value) => {
        const fileIndex = {}

        let files
        if (_.isNil(value) || _.isEmpty(value)) {
            files = []
        } else {
            files = _.castArray(value)
        }

        _.castArray(files).reduce((acc, file, i) => _.set(acc, objectHash(file), i), fileIndex)
        return { files, fileIndex }
    }

    /**
    * Invokes onChange and sets the state if not controlled
    */
    handleChange = (files) => {
        _.invoke(this.props, 'onChange', this.props.multiple ? files : _.get(files, 0, null))
        if (_.isNil(this.props.value)) {
            this.setState(this.determineState(files))
        }
    }

    /**
    * Interface method to add a file
    */
    addFile(file) {
        const hash = objectHash(file)
        if (this.state.fileIndex[hash]) return
        this.handleChange(this.state.files.concat(file))
    }

    /**
    * Interface method to remove a file defined by its hash
    */
    removeFileByHash(hash) {
        if (_.isNil(this.state.fileIndex[hash])) return
        const files = this.state.files.slice()
        files.splice(this.state.fileIndex[hash], 1)
        this.handleChange(files)
    }

    //
    // Dropzone events and handlers
    //

    /**
    * Takes event handlers in this.props.eventHandlers
    * and binds them to dropzone.js events
    */
    subscribe = () => {
        const eventHandlers = this.props.eventHandlers

        if (!this.dropzone || !eventHandlers) return

        Object.keys(eventHandlers).map((eventHandler) => {
            if (eventHandlers[eventHandler]) {
                if (eventHandler === 'init') {
                    eventHandlers[eventHandler](this.dropzone)
                } else {
                    this.dropzone.on(eventHandler, eventHandlers[eventHandler])
                }
            }
            return false
        })

        this.dropzone.on('removedfile', this.handleFileRemoved)
        this.dropzone.on('success', this.handleUploadSucessful)
        this.dropzone.on('addedfile', this.handleFileAdded)
    }

    handleFileAdded = (dzFile) => {
        // Add a download link
        if (dzFile.url) {
            const link = document.createElement('a')
            link.setAttribute('href', dzFile.url)
            link.setAttribute('class', 'dz-download')
            link.setAttribute('target', '_blank')
            const elmFilename = _.get(dzFile.previewElement.getElementsByClassName('dz-filename'), 0)
            if (elmFilename) {
                for (let i = 0; i < elmFilename.childNodes.length; i += 1) {
                    if (elmFilename.childNodes[i].hasAttribute('data-dz-name')) {
                        link.appendChild(elmFilename.replaceChild(link, elmFilename.childNodes[i]))
                        break;
                    }
                }
            }
        }
    }

    handleUploadSucessful = (dzFile, response) => {
        // Save the hash
        dzFile.hash = objectHash(response) // eslint-disable-line
        this.addFile(response)
    }

    handleFileRemoved = (dzFile) => {
        if (!dzFile) return
        this.removeFileByHash(dzFile.hash)
    }

    //
    // Functions to manipulate the dropzone
    //

    /**
    * Removes ALL listeners and Destroys dropzone. see https://github.com/enyo/dropzone/issues/1175
    */
    destroy = (dropzone) => {
        dropzone.off()
        return dropzone.destroy()
    }

    addFileToDropzone = (file) => {
        const { getFileName, getFileSize } = this.props
        const cloned = _.clone(file)
        cloned.hash = objectHash(file)
        cloned.status = 'success'
        cloned.accepted = true
        cloned.name = _.isFunction(getFileName) ? getFileName(file) : _.get(file, getFileName)
        cloned.size = _.isFunction(getFileSize) ? getFileName(file) : _.get(file, getFileSize)
        this.dropzone.emit('addedfile', cloned)
        this.dropzone.emit('complete', cloned)
        this.dropzone.files.push(cloned)
    }

    removeFileFromDropzone = (file) => {
        this.dropzone.emit('removedfile', file)
    }

    //
    // Render
    //

    render() {
        const { className, children } = this.props
        const classes = cx('bubl-input bubl-file-upload', className)
        const divProps = { className: classes }
        const dz = <div ref={(c) => { this.dz = c }} />

        let childElements
        if (!childrenUtils.isNil(children)) {
            // Replace placeholder <input /> with a dropzone node
            childElements = childrenUtils.traverse(children, (child) => {
                if (child.type === 'input') return dz
                return child
            })
        } else {
            // shorthand
            childElements = dz
        }

        return <div {...divProps} >{childElements}</div>
    }
}

FileUpload.propTypes = {
    value: PropTypes.any,
    children: PropTypes.node,
    className: PropTypes.string,
    config: PropTypes.shape({}),
    eventHandlers: PropTypes.shape({}),
    onChange: PropTypes.func,
    /**
    * Used to obtain the file name from the response.
    * If a string is provided then the function to retreive the name will be:
    *    response => response[this.props.getFileName]
    * Default value: 'name' */
    getFileName: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
    /**
    * Used to obtain the file size from the response.
    * If a string is provided then the function to retreive the file size will be:
    *    response => response[this.props.getFileSize]
    * Default value: 'size' */
    getFileSize: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
    /**
    * Whether multiple files can be uploaded.
    * The FileUpload's value is an array if multiple.
    * Default value `false`
    */
    multiple: PropTypes.bool,
}

FileUpload.defaultProps = {
    config: {},
    eventHandlers: {},
    getFileName: 'name',
    getFileSize: 'size',
    multiple: false,
}

export default FileUpload
