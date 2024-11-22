;
(function(TB) {
    'use strict';

    TB.Status = function(inputStatus, retryCallback) {
        var statusObject;

        if (!inputStatus || inputStatus == TB.Status.CONFIG.STATUSES.PENDING || inputStatus.status == TB.Status.CONFIG.STATUSES.PENDING) {
            statusObject = {
                status: TB.Status.CONFIG.STATUSES.PENDING,
            };
        }

        if (typeof inputStatus == 'string') {
            statusObject = {
                status: inputStatus,
            };
        }

        statusObject = statusObject || inputStatus;

        this.retry = (inputStatus instanceof Object && inputStatus.retry);
        this.success = false;
        this.status = statusObject.status;
        this.retryCallback = (typeof retryCallback == 'function') ? retryCallback : function() {
        };

        switch (statusObject.status) {
            case TB.Status.CONFIG.STATUSES.PENDING:
                this.code = statusObject.code || null;
                this.message = statusObject.msg || statusObject.message || null;
                break;
            case TB.Status.CONFIG.STATUSES.USER_ERROR:
            case TB.Status.CONFIG.STATUSES.SYS_ERROR:
            case TB.Status.CONFIG.STATUSES.PEER_ERROR:
                this.message = statusObject.msg || statusObject.message;
                this.code = statusObject.code;
                break;
            case TB.Status.CONFIG.STATUSES.OK:
                this.success = true;
                this.message = statusObject.msg || statusObject.message;
                this.code = statusObject.code;
                break;
            case TB.Status.CONFIG.STATUSES.TRANSPORT_ERROR:
                this.retry = true;
                break;
            default:
                TB.DEBUG.THROW_PEER('Unknown text status {{ ' + statusObject.status + ' }}');
        }
        this.isUI = (statusObject.status == TB.Status.CONFIG.STATUSES.USER_ERROR);
    };

    TB.Status.prototype = {
        setStatuses: function(statuses) {
            $.extend(TB.Status.CONFIG.STATUSES, statuses);
        },
        updateStatus: function(inputStatus, retryCallback) {
            var statusObject = (typeof inputStatus == 'string') ? {
                status: inputStatus,
            } : inputStatus;

            this.retryCallback = (typeof retryCallback == 'function') ? retryCallback : this.retryCallback;

            if(statusObject.hasOwnProperty('msg') || statusObject.hasOwnProperty('message')) {
                var message = statusObject.msg || statusObject.message;
            }

            if(statusObject.hasOwnProperty('retry')) {
                this.retry = statusObject.retry;
            }

            this.status = statusObject.status || this.status;

            switch (statusObject.status) {
                case TB.Status.CONFIG.STATUSES.PENDING:
                    this.code = statusObject.code || this.code;
                    this.success = false;
                    break;
                case TB.Status.CONFIG.STATUSES.SYS_ERROR:
                    this.retry = true;
                case TB.Status.CONFIG.STATUSES.USER_ERROR:
                case TB.Status.CONFIG.STATUSES.PEER_ERROR:
                    this.code = statusObject.code || this.code;
                    this.message = message || this.message;
                    this.isUI = (statusObject.status == TB.Status.CONFIG.STATUSES.USER_ERROR);
                    this.success = false;
                    break;
                case TB.Status.CONFIG.STATUSES.OK:
                    this.code = statusObject.code || this.code;
                    this.message = message || this.message;
                    this.success = true;
                    break;
                case TB.Status.CONFIG.STATUSES.TRANSPORT_ERROR:
                    this.retry = true;
                    this.success = false;
                    break;
            }
        },
    };

    TB.Status.CONFIG = {
        STATUSES: {
            OK: 'ok',
            SYS_ERROR: 'server_sys_error',
            PEER_ERROR: 'client_sys_error',
            USER_ERROR: 'ui_error',
            TRANSPORT_ERROR: 'transport_error',
            PENDING: 'pending',
        },
    };

    window.TB = TB;
})(window.TB || {});
