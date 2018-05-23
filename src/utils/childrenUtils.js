import { Children, cloneElement } from 'react'

export const isNil = children => children === null
    || children === false
    || children === undefined
    || (Array.isArray(children) && children.length === 0)


const applyBottomUp = (node, cb) => {
    // Ignore null nodes
    if (node === null) return null

    // Stop condition
    if (typeof node !== 'object' || isNil(node.props.children)) {
        return cb(node)
    }

    let shouldClone = false
    const traversedChildren = Children.map(node.props.children, (child) => {
        const result = applyBottomUp(child, cb)

        // child was cloned
        if (child !== result) shouldClone = true

        return result
    })

    return cb(node, traversedChildren, shouldClone)
}

const applyTopDown = (node, cb) => {
    // Ignore null nodes
    if (node === null) return null

    // Stop condition
    if (typeof node !== 'object' || isNil(node.props.children)) {
        return cb(node)
    }

    // Apply the callback to the parent first
    const newNode = cb(node)

    // If node was cloned then stop here
    if (newNode !== node) {
        return newNode
    }

    // Otherwise descent to children
    let shouldClone = false
    const traversedChildren = Children.map(node.props.children, (child) => {
        const newChild = applyTopDown(child, cb)

        // child was cloned
        if (child !== newChild) shouldClone = true

        return newChild
    })

    // Clone if any child has changed
    if (shouldClone) return cloneElement(node, null, traversedChildren)

    // If no child changed, simply return the node
    return node
}


/**
* Traverses children recursively and executes a provided function once for each node in the tree.
*
* If topDown is true, the callback will be called on the current node before it is called on its
* children and if the callback clones the current node the node's children will NOT be traversed.
* Also, the parent node of any cloned node will be automatically cloned in order to reflect the
* changes. Top-down traversing is good for example, if you need to find the first occurence of a
* particular node in the tree. The callback receives a single parameter: the current node.
*
* If topDown is false, the function execute bottom-up traversing. In this case, the callback is
* called on the children first, then on the parent node. The callback will receive the following
* arguments: child, traversedChildren, shouldClone
* Where:
*   - child is the current node,
*   - traversedChildren is an array of the current node's children that have already been traversed
*   - shouldClone which will be true, if at least one of the traversedChildren has been cloned
* Bottom-up traversing allows you to process all nodes in the tree.
*/
export const traverse = (children, cb, topDown = true) => {
    if (topDown) {
        return Children.map(children, child => applyTopDown(child, cb))
    }
    return Children.map(children, child => applyBottomUp(child, cb))
}
