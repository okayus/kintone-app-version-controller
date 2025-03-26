declare namespace kintone.types {
  interface Fields {
    getAppCustomizeResponse: kintone.fieldTypes.MultiLineText;
    getAppsResponse: kintone.fieldTypes.MultiLineText;
    getAdminNotesResponse: kintone.fieldTypes.MultiLineText;
    getFormFieldsResponse: kintone.fieldTypes.MultiLineText;
    getFieldAclResponse: kintone.fieldTypes.MultiLineText;
    getAppAclResponse: kintone.fieldTypes.MultiLineText;
    getDeployStatusResponse: kintone.fieldTypes.MultiLineText;
    getAppSettingsResponse: kintone.fieldTypes.MultiLineText;
    getViewsResponse: kintone.fieldTypes.MultiLineText;
    appId: kintone.fieldTypes.Number;
    getProcessManagementResponse: kintone.fieldTypes.MultiLineText;
    getFormLayoutResponse: kintone.fieldTypes.MultiLineText;
    データ種別: kintone.fieldTypes.RadioButton;
    getReminderNotificationsResponse: kintone.fieldTypes.MultiLineText;
    getPerRecordNotificationsResponse: kintone.fieldTypes.MultiLineText;
    version: kintone.fieldTypes.Number;
    getAppResponse: kintone.fieldTypes.MultiLineText;
    getAppActionsResponse: kintone.fieldTypes.MultiLineText;
    app_name: kintone.fieldTypes.SingleLineText;
    getPluginsResponse: kintone.fieldTypes.MultiLineText;
    getRecordAclResponse: kintone.fieldTypes.MultiLineText;
    getReportsResponse: kintone.fieldTypes.MultiLineText;
    getGeneralNotificationsResponse: kintone.fieldTypes.MultiLineText;

    アクティブバージョン: kintone.fieldTypes.CheckBox;
  }
  interface SavedFields extends Fields {
    $id: kintone.fieldTypes.Id;
    $revision: kintone.fieldTypes.Revision;
    更新者: kintone.fieldTypes.Modifier;
    作成者: kintone.fieldTypes.Creator;
    レコード番号: kintone.fieldTypes.RecordNumber;
    更新日時: kintone.fieldTypes.UpdatedTime;
    作成日時: kintone.fieldTypes.CreatedTime;
  }
}
