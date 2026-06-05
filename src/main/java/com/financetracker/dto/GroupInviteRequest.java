package com.financetracker.dto;

import java.util.List;

public class GroupInviteRequest {

    private String groupName;
    private List<String> emails;

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
    }

    public List<String> getEmails() {
        return emails;
    }

    public void setEmails(List<String> emails) {
        this.emails = emails;
    }
}
