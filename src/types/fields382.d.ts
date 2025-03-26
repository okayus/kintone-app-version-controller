declare namespace kintone.types {
  interface Fields {
    code: kintone.fieldTypes.SingleLineText;
    getAppCustomizeResponse: kintone.fieldTypes.MultiLineText;
    getAppsResponse: kintone.fieldTypes.MultiLineText;
    getAdminNotesResponse: kintone.fieldTypes.MultiLineText;
    description: kintone.fieldTypes.MultiLineText;
    アプリへのリンク: kintone.fieldTypes.Link;
    getFormFieldsResponse: kintone.fieldTypes.MultiLineText;
    getFieldAclResponse: kintone.fieldTypes.MultiLineText;
    threadId: kintone.fieldTypes.Number;
    spaceId: kintone.fieldTypes.Number;
    getAppAclResponse: kintone.fieldTypes.MultiLineText;
    getDeployStatusResponse: kintone.fieldTypes.MultiLineText;
    getAppSettingsResponse: kintone.fieldTypes.MultiLineText;
    appType: kintone.fieldTypes.DropDown;
    getViewsResponse: kintone.fieldTypes.MultiLineText;
    appId: kintone.fieldTypes.Number;
    getProcessManagementResponse: kintone.fieldTypes.MultiLineText;
    getFormLayoutResponse: kintone.fieldTypes.MultiLineText;
    getReminderNotificationsResponse: kintone.fieldTypes.MultiLineText;
    getPerRecordNotificationsResponse: kintone.fieldTypes.MultiLineText;
    getAppResponse: kintone.fieldTypes.MultiLineText;
    getAppActionsResponse: kintone.fieldTypes.MultiLineText;
    getPluginsResponse: kintone.fieldTypes.MultiLineText;
    getRecordAclResponse: kintone.fieldTypes.MultiLineText;
    getReportsResponse: kintone.fieldTypes.MultiLineText;
    getGeneralNotificationsResponse: kintone.fieldTypes.MultiLineText;
    name: kintone.fieldTypes.SingleLineText;
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
