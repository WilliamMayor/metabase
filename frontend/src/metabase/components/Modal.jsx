import React, { Component } from "react";
import ReactDOM from "react-dom";
import cx from "classnames";

import { getScrollX, getScrollY } from "metabase/lib/dom";

import { Motion, spring } from "react-motion";

import OnClickOutsideWrapper from "./OnClickOutsideWrapper.jsx";
import ModalContent from "./ModalContent";

import _ from "underscore";

function getModalContent(props) {
    if (React.Children.count(props.children) > 1 ||
        props.title != null || props.footer != null
    ) {
        return <ModalContent {..._.omit(props, "className", "style")} />
    } else {
        return React.Children.only(props.children);
    }
}

export class WindowModal extends Component {

    static defaultProps = {
        className: "Modal",
    };

    componentWillMount() {
        this._modalElement = document.createElement('span');
        this._modalElement.className = 'ModalContainer';
        document.querySelector('body').appendChild(this._modalElement);
    }

    componentDidMount() {
        this._renderPopover();
    }

    componentDidUpdate() {
        this._renderPopover();
    }

    componentWillUnmount() {
        ReactDOM.unmountComponentAtNode(this._modalElement);
        if (this._modalElement.parentNode) {
            this._modalElement.parentNode.removeChild(this._modalElement);
        }
    }

    handleDismissal() {
        if (this.props.onClose) {
            this.props.onClose()
        }
    }

    _modalComponent() {
        const className = cx(this.props.className, ...["small", "medium", "wide", "tall"].filter(type => this.props[type]).map(type => `Modal--${type}`))
        return (
            <OnClickOutsideWrapper handleDismissal={this.handleDismissal.bind(this)}>
                <div className={cx(className, 'relative bordered bg-white rounded')}>
                    { getModalContent({
                        ...this.props,
                        fullPageModal: false,
                        formModal: !!this.props.form
                    }) }
                </div>
            </OnClickOutsideWrapper>
        );
    }

    _renderPopover() {
        const { isOpen } = this.props;
        const backdropClassnames = 'Modal-backdrop flex justify-center align-center fixed top left bottom right';

        ReactDOM.unstable_renderSubtreeIntoContainer(this,
            <Motion
                defaultStyle={{ opacity: 0, translate: 250 }}
                style={isOpen ?
                    { opacity: spring(1), translate: spring(0) } :
                    { opacity: spring(0), translate: spring(250)}
                }
            >
                { style =>
                    <div>
                        { isOpen &&
                                <div key="modal" className={backdropClassnames} style={{
                                    opacity: style.opacity
                                }}>
                                    <div style={{
                                        opacity: style.opacity,
                                        transform: `translateY(${style.translate})px`
                                    }}>
                                        {this._modalComponent()}
                                    </div>
                            </div>
                        }
                    </div>
                }
            </Motion>
        , this._modalElement);
    }

    render() {
        return null;
    }
}

import routeless from "metabase/hoc/Routeless";

export class FullPageModal extends Component {
    componentDidMount() {
        this._modalElement = document.createElement("div");
        this._modalElement.className = "Modal--full";
        document.querySelector('body').appendChild(this._modalElement);

        // save the scroll position, scroll to the top left, and disable scrolling
        this._scrollX = getScrollX();
        this._scrollY = getScrollY();
        window.scrollTo(0,0);
        document.body.style.overflow = "hidden";

        this.componentDidUpdate();
    }

    componentDidUpdate() {
        // set the top of the modal to the bottom of the nav
        let nav = document.body.querySelector(".Nav");
        if (nav) {
            this._modalElement.style.top = nav.getBoundingClientRect().bottom + "px";
        }
        this._renderModal(true)
    }

    componentWillUnmount() {
        this._renderModal(false);

        // restore scroll position and scrolling
        document.body.style.overflow = "";

        // On IE11 a timeout is required for the scroll to happen after the change of overflow setting
        setTimeout(() => {
            window.scrollTo(this._scrollX, this._scrollY);
        }, 0)

        // wait for animations to complete before unmounting
        setTimeout(() => {
            ReactDOM.unmountComponentAtNode(this._modalElement);
            this._modalElement.parentNode.removeChild(this._modalElement);
        }, 300);
    }

    _renderModal(open) {
        ReactDOM.unstable_renderSubtreeIntoContainer(this,
            <Motion defaultStyle={{ opacity: 0, top: 20 }} style={open ?
                { opacity: spring(1), top: spring(0) } :
                { opacity: spring(0), top: spring(20) }
            }>
                { motionStyle =>
                    <div className="full-height relative scroll-y" style={motionStyle}>
                        { getModalContent({
                            ...this.props,
                            fullPageModal: true,
                            formModal: !!this.props.form
                        }) }
                    </div>
                }
            </Motion>
        , this._modalElement);
    }

    render() {
        return null;
    }
}

export class InlineModal extends Component {
    render() {
        return (
            <div>
                {this.props.isOpen ? <FullPageModal {...this.props} /> : null}
            </div>
        );
    }
}

// the "routeless" version should only be used for non-inline modals
const RoutelessFullPageModal = routeless(FullPageModal);

const Modal = ({ full, inline, ...props }) =>
    full ?
        (props.isOpen ? <RoutelessFullPageModal {...props} /> : null)
    : inline ?
        <InlineModal {...props} />
    :
        <WindowModal {...props} />;

Modal.defaultProps = {
    isOpen: true,
};

export default Modal;
