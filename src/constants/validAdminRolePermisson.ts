export = Object.freeze({
    PERMISSIONS: {
        ADMINUSER_CREATOR: 'adminUser.creator',
        ADMINUSER_VIEWER: 'adminUser.viewer',
        ADMINUSER_EDITOR: 'adminUser.editor',
        ADMINUSER_REMOVER: 'adminUser.remover',

        BUYER_CREATOR: 'buyer.creator',
        BUYER_VIEWER: 'buyer.viewer',
        BUYER_EDITOR: 'buyer.editor',
        BUYER_REMOVER: 'buyer.remover',

        VENDOR_CREATOR: 'vendor.creator',
        VENDOR_VIEWER: 'vendor.viewer',
        VENDOR_EDITOR: 'vendor.editor',
        VENDOR_REMOVER: 'vendor.remover',

        TRANSPORTER_CREATOR: 'transporter.creator',
        TRANSPORTER_VIEWER: 'transporter.viewer',
        TRANSPORTER_EDITOR: 'transporter.editor',
        TRANSPORTER_REMOVER: 'transporter.remover',

        COMMON_CREATOR: 'common.creator',
        COMMON_VIEWER: 'common.viewer',
        COMMON_EDITOR: 'common.editor',
        COMMON_REMOVER: 'common.remover',

        ORDER_CREATOR: 'order.creator',
        ORDER_VIEWER: 'order.viewer',
        ORDER_EDITOR: 'order.editor',
        ORDER_REMOVER: 'order.remover',

        MESSAGECENTER_CREATOR: 'messageCenter.creator',
        MESSAGECENTER_VIEWER: 'messageCenter.viewer',
        MESSAGECENTER_EDITOR: 'messageCenter.editor',
        MESSAGECENTER_REMOVER: 'messageCenter.remover',

        EVENT_CREATOR: 'event.creator',
        EVENT_VIEWER: 'event.viewer',
        EVENT_EDITOR: 'event.editor',
        EVENT_REMOVER: 'event.remover',

        AI_CREATOR: 'ai.creator',
        AI_VIEWER: 'ai.viewer',
        AI_EDITOR: 'ai.editor',
        AI_REMOVER: 'ai.remover',

        SPONSERADD_CREATOR: 'sponserAdd.creator',
        SPONSERADD_VIEWER: 'sponserAdd.viewer',
        SPONSERADD_EDITOR: 'sponserAdd.editor',
        SPONSERADD_REMOVER: 'sponserAdd.remover',


        MEMBERSHIP_CREATOR: 'membership.creator',
        MEMBERSHIP_VIEWER: 'membership.viewer',
        MEMBERSHIP_EDITOR: 'membership.editor',
        MEMBERSHIP_REMOVER: 'membership.remover',

        LSQ_CREATOR: 'lsq.creator',
        LSQ_VIEWER: 'lsq.viewer',
        LSQ_EDITOR: 'lsq.editor',
        LSQ_REMOVER: 'lsq.remover',

        TICKET_CREATOR: 'ticket.creator',
        TICKET_VIEWER: 'ticket.viewer',
        TICKET_EDITOR: 'ticket.editor',
        TICKET_REMOVER: 'ticket.remover',

        BLOG_CREATOR: 'blog.creator',
        BLOG_VIEWER: 'blog.viewer',
        BLOG_EDITOR: 'blog.editor',
        BLOG_REMOVER: 'blog.remover',

        FINANCE_CREATOR: 'finance.creator',
        FINANCE_VIEWER: 'finance.viewer',
        FINANCE_EDITOR: 'finance.editor',
        FINANCE_REMOVER: 'finance.remover',

        HSCODE_CREATOR: 'hsCode.creator',
        HSCODE_VIEWER: 'hsCode.viewer',
        HSCODE_EDITOR: 'hsCode.editor',
        HSCODE_REMOVER: 'hsCode.remover',

        CATEGORY_CREATOR: 'category.creator',
        CATEGORY_VIEWER: 'category.viewer',

        ANNUALREVENUE_CREATOR: 'annualRevenue.creator',
        ANNUALREVENUE_VIEWER: 'annualRevenue.viewer',
        ANNUALREVENUE_EDITOR: 'annualRevenue.editor',
        ANNUALREVENUE_REMOVER: 'annualRevenue.remover',

        CERTIFICATETYPES_CREATOR: 'certificateTypes.creator',
        CERTIFICATETYPES_VIEWER: 'certificateTypes.viewer',
        CERTIFICATETYPES_EDITOR: 'certificateTypes.editor',
        CERTIFICATETYPES_REMOVER: 'certificateTypes.remover',

        CERTIFICATEISSUEDBY_CREATOR: 'certificateIssuedBy.creator',
        CERTIFICATEISSUEDBY_VIEWER: 'certificateIssuedBy.viewer',
        CERTIFICATEISSUEDBY_EDITOR: 'certificateIssuedBy.editor',
        CERTIFICATEISSUEDBY_REMOVER: 'certificateIssuedBy.remover',

        EMPLOYESNO_CREATOR: 'employesNo.creator',
        EMPLOYESNO_VIEWER: 'employesNo.viewer',
        EMPLOYESNO_EDITOR: 'employesNo.editor',
        EMPLOYESNO_REMOVER: 'employesNo.remover',

        OFFICESIZE_CREATOR: 'officeSize.creator',
        OFFICESIZE_VIEWER: 'officeSize.viewer',
        OFFICESIZE_EDITOR: 'officeSize.editor',
        OFFICESIZE_REMOVER: 'officeSize.remover',

        LANGUAGE_CREATOR: 'language.creator',
        LANGUAGE_VIEWER: 'language.viewer',
        LANGUAGE_EDITOR: 'language.editor',
        LANGUAGE_REMOVER: 'language.remover',

        COMMUNICATION_TYPE_CREATOR: 'communicationType.creator',
        COMMUNICATION_TYPE_VIEWER: 'communicationType.viewer',
        COMMUNICATION_TYPE_EDITOR: 'communicationType.editor',
        COMMUNICATION_TYPE_REMOVER: 'communicationType.remover',

        UNITTYPE_CREATOR: 'unitType.creator',
        UNITTYPE_VIEWER: 'unitType.viewer',
        UNITTYPE_EDITOR: 'unitType.editor',
        UNITTYPE_REMOVER: 'unitType.remover',

        BUSINESSTYPE_CREATOR: 'businessType.creator',
        BUSINESSTYPE_VIEWER: 'businessType.viewer',
        BUSINESSTYPE_EDITOR: 'businessType.editor',
        BUSINESSTYPE_REMOVER: 'businessType.remover',

        CONTINENT_CREATOR: 'continent.creator',
        CONTINENT_VIEWER: 'continent.viewer',
        CONTINENT_EDITOR: 'continent.editor',
        CONTINENT_REMOVER: 'continent.remover',

        COUNTRY_CREATOR: 'country.creator',
        COUNTRY_VIEWER: 'country.viewer',
        COUNTRY_EDITOR: 'country.editor',
        COUNTRY_REMOVER: 'country.remover',

        UNIT_PACKAGING_TYPE_CREATOR: 'unitPackagingType.creator',
        UNIT_PACKAGING_TYPE_VIEWER: 'unitPackagingType.viewer',
        UNIT_PACKAGING_TYPE_EDITOR: 'unitPackagingType.editor',
        UNIT_PACKAGING_TYPE_REMOVER: 'unitPackagingType.remover',

        SERVICES_TYPE_CREATOR: 'servicesType.creator',
        SERVICES_TYPE_VIEWER: 'servicesType.viewer',
        SERVICES_TYPE_EDITOR: 'servicesType.editor',
        SERVICES_TYPE_REMOVER: 'servicesType.remover',

        CURRENCY_TYPE_CREATOR: 'currencyType.creator',
        CURRENCY_TYPE_VIEWER: 'currencyType.viewer',
        CURRENCY_TYPE_EDITOR: 'currencyType.editor',
        CURRENCY_TYPE_REMOVER: 'currencyType.remover',

        SOURCING_TYPE_CREATOR: 'sourcingType.creator',
        SOURCING_TYPE_VIEWER: 'sourcingType.viewer',
        SOURCING_TYPE_EDITOR: 'sourcingType.editor',
        SOURCING_TYPE_REMOVER: 'sourcingType.remover',

        SOURCING_PURPOSE_CREATOR: 'sourcingPurpose.creator',
        SOURCING_PURPOSE_VIEWER: 'sourcingPurpose.viewer',
        SOURCING_PURPOSE_EDITOR: 'sourcingPurpose.editor',
        SOURCING_PURPOSE_REMOVER: 'sourcingPurpose.remover',

        AREA_TYPE_CREATOR: 'areaType.creator',
        AREA_TYPE_VIEWER: 'areaType.viewer',
        AREA_TYPE_EDITOR: 'areaType.editor',
        AREA_TYPE_REMOVER: 'areaType.remover',

        TRADE_TERMS_CREATOR: 'tradeTerms.creator',
        TRADE_TERMS_VIEWER: 'tradeTerms.viewer',
        TRADE_TERMS_EDITOR: 'tradeTerms.editor',
        TRADE_TERMS_REMOVER: 'tradeTerms.remover',

        BUDGET_CREATOR: 'budget.creator',
        BUDGET_VIEWER: 'budget.viewer',
        BUDGET_EDITOR: 'budget.editor',
        BUDGET_REMOVER: 'budget.remover',

        SHIPPING_METHOD_CREATOR: 'shippingMethod.creator',
        SHIPPING_METHOD_VIEWER: 'shippingMethod.viewer',
        SHIPPING_METHOD_EDITOR: 'shippingMethod.editor',
        SHIPPING_METHOD_REMOVER: 'shippingMethod.remover',

        PAYMENT_METHOD_CREATOR: 'paymentMethod.creator',
        PAYMENT_METHOD_VIEWER: 'paymentMethod.viewer',
        PAYMENT_METHOD_EDITOR: 'paymentMethod.editor',
        PAYMENT_METHOD_REMOVER: 'paymentMethod.remover',

        PAYMENT_TYPE_CREATOR: 'paymentType.creator',
        PAYMENT_TYPE_VIEWER: 'paymentType.viewer',
        PAYMENT_TYPE_EDITOR: 'paymentType.editor',
        PAYMENT_TYPE_REMOVER: 'paymentType.remover',

        PRODUCT_FEEDBACK_CREATOR: 'productFeedback.creator',
        PRODUCT_FEEDBACK_VIEWER: 'productFeedback.viewer',
        PRODUCT_FEEDBACK_EDITOR: 'productFeedback.editor',
        PRODUCT_FEEDBACK_REMOVER: 'productFeedback.remover',

        AAZIKO_FEEDBACK_CREATOR: 'aazikoFeedback.creator',
        AAZIKO_FEEDBACK_VIEWER: 'aazikoFeedback.viewer',
        AAZIKO_FEEDBACK_EDITOR: 'aazikoFeedback.editor',
        AAZIKO_FEEDBACK_REMOVER: 'aazikoFeedback.remover',

        INSPECTOR_CREATOR: 'inspector.creator',
        INSPECTOR_VIEWER: 'inspector.viewer',
        INSPECTOR_EDITOR: 'inspector.editor',
        INSPECTOR_REMOVER: 'inspector.remover',

        INSPECTOR_TYPE_CREATOR: 'inspectionType.creator',
        INSPECTOR_TYPE_VIEWER: 'inspectionType.viewer',
        INSPECTOR_TYPE_EDITOR: 'inspectionType.editor',
        INSPECTOR_TYPE_REMOVER: 'inspectionType.remover',

        CARGO_TYPE_CREATOR: 'cargoType.creator',
        CARGO_TYPE_VIEWER: 'cargoType.viewer',
        CARGO_TYPE_EDITOR: 'cargoType.editor',
        CARGO_TYPE_REMOVER: 'cargoType.remover',

        INSPECTOR_PRODUCT_CREATOR: 'inspectionProduct.creator',
        INSPECTOR_PRODUCT_VIEWER: 'inspectionProduct.viewer',
        INSPECTOR_PRODUCT_EDITOR: 'inspectionProduct.editor',
        INSPECTOR_PRODUCT_REMOVER: 'inspectionProduct.remover',

        INSPECTOR_QUESTION_CREATOR: 'inspectionQuestion.creator',
        INSPECTOR_QUESTION_VIEWER: 'inspectionQuestion.viewer',
        INSPECTOR_QUESTION_EDITOR: 'inspectionQuestion.editor',
        INSPECTOR_QUESTION_REMOVER: 'inspectionQuestion.remover',

        INSPECTOR_NEED_THINGS_CREATOR: 'inspectionNeedThings.creator',
        INSPECTOR_NEED_THINGS_VIEWER: 'inspectionNeedThings.viewer',
        INSPECTOR_NEED_THINGS_EDITOR: 'inspectionNeedThings.editor',
        INSPECTOR_NEED_THINGS_REMOVER: 'inspectionNeedThings.remover',

       CARGO_IMO_CLASS_CREATOR: 'cargoImoClass.creator',
       CARGO_IMO_CLASS_VIEWER: 'cargoImoClass.viewer',
       CARGO_IMO_CLASS_EDITOR: 'cargoImoClass.editor',
       CARGO_IMO_CLASS_REMOVER: 'cargoImoClass.remover',
       
        BUYER_DASHBOARD_CREATOR: 'buyerDashboard.creator',
        BUYER_DASHBOARD_VIEWER: 'buyerDashboard.viewer',
        BUYER_DASHBOARD_EDITOR: 'buyerDashboard.editor',
        BUYER_DASHBOARD_REMOVER: 'buyerDashboard.remover',

        /* VENDOR*/

        USER_VENDOR_VIEWER: 'userVendor.viewer',
        USER_VENDOR_SENT_WHATSAPP_MESAGE: 'userVendor.send-whatsappMsg',
        COMPANY_VENDOR_VIEWER: 'companyVendor.viewer',

        PRODUCT_VENDOR_VIEWER: 'productVendor.viewer',
        PRODUCT_VENDOR_EDITOR: 'productVendor.editor',

        PRODUCT_INQUIRY_VIEWER: 'productInquiry.viewer',
        PRODUCT_INQUIRY_EDITOR: 'productInquiry.editor',

        /*BUYER*/

        USER_BUYER_VIEWER: 'userBuyer.viewer',

        ORDER_INVOICE_BUYER_VIEWER: 'orderInvoiceBuyer.viewer',
        ORDER_INVOICE_BUYER_EDITOR: 'orderInvoiceBuyer.editor',

        ORDER_CONTRACT_BUYER_VIEWER: 'orderContractBuyer.viewer',
        ORDER_CONTRACT_BUYER_EDITOR: 'orderContractBuyer.editor',
    }
})