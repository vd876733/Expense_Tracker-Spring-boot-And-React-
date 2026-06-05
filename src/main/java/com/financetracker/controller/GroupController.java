package com.financetracker.controller;

import com.financetracker.entity.ExpenseGroup;
import com.financetracker.entity.GroupExpense;
import com.financetracker.entity.GroupMembership;
import com.financetracker.entity.MembershipStatus;
import com.financetracker.entity.User;
import com.financetracker.repository.GroupMembershipRepository;
import com.financetracker.repository.ExpenseGroupRepository;
import com.financetracker.repository.GroupExpenseRepository;
import com.financetracker.repository.UserRepository;
import com.financetracker.dto.GroupReminderRequest;
import com.financetracker.dto.GroupInviteRequest;
import com.financetracker.service.EmailReminderService;
import com.financetracker.service.GroupInviteEmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/groups")
@CrossOrigin(origins = "${ALLOWED_ORIGINS:http://localhost:3000,https://your-app.netlify.app}")
public class GroupController {

    @Autowired
    private ExpenseGroupRepository expenseGroupRepository;

    @Autowired
    private GroupExpenseRepository groupExpenseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupMembershipRepository groupMembershipRepository;

    @Autowired
    private EmailReminderService emailReminderService;

    @Autowired
    private GroupInviteEmailService groupInviteEmailService;

    /**
     * POST /api/groups
     * Create a new expense group with 3+ members by email
     */
    @PostMapping
    public ResponseEntity<?> createGroup(@RequestBody Map<String, Object> payload,
                                         Authentication authentication) {
        String requesterEmail = resolveEmail(authentication);
        if (requesterEmail == null || requesterEmail.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not authenticated"));
        }

        Optional<User> creatorOptional = userRepository.findByEmailIgnoreCase(requesterEmail);
        if (creatorOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found"));
        }
        User creator = creatorOptional.get();

        String groupName = payload.get("groupName") instanceof String value ? value.trim() : null;
        Object emailsObj = payload.get("emails");

        if (groupName == null || groupName.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "groupName is required"));
        }

        if (!(emailsObj instanceof List<?> rawList)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "emails must be a list"));
        }

        Set<String> emailSet = new LinkedHashSet<>();
        for (Object item : rawList) {
            if (item instanceof String emailValue) {
                String cleaned = emailValue.trim().toLowerCase();
                if (!cleaned.isBlank()) {
                    emailSet.add(cleaned);
                }
            }
        }

        if (emailSet.size() < 3) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "At least 3 unique member emails are required"));
        }

        List<User> members = new ArrayList<>();
        List<String> missingEmails = new ArrayList<>();

        for (String email : emailSet) {
            Optional<User> userOptional = userRepository.findByEmailIgnoreCase(email);
            if (userOptional.isPresent()) {
                members.add(userOptional.get());
            } else {
                missingEmails.add(email);
            }
        }

        if (!missingEmails.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Some emails do not exist", "missing", missingEmails));
        }

        ExpenseGroup group = new ExpenseGroup();
        group.setGroupName(groupName);

        GroupMembership creatorMembership = new GroupMembership();
        creatorMembership.setUser(creator);
        creatorMembership.setStatus(MembershipStatus.ACCEPTED);
        group.addMembership(creatorMembership);

        for (User member : members) {
            if (member.getId() != null && member.getId().equals(creator.getId())) {
                continue;
            }
            GroupMembership membership = new GroupMembership();
            membership.setUser(member);
            membership.setStatus(MembershipStatus.PENDING);
            group.addMembership(membership);
        }

        ExpenseGroup saved = expenseGroupRepository.save(group);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * GET /api/groups?status=ACCEPTED|PENDING
     * Fetch groups for the authenticated user by membership status
     */
    @GetMapping
    public ResponseEntity<?> getGroupsByStatus(@RequestParam(name = "status") String status,
                                               Authentication authentication) {
        String requesterEmail = resolveEmail(authentication);
        if (requesterEmail == null || requesterEmail.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not authenticated"));
        }

        MembershipStatus parsedStatus;
        try {
            parsedStatus = MembershipStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "status must be ACCEPTED or PENDING"));
        }

        List<ExpenseGroup> groups = expenseGroupRepository
                .findByUserEmailAndStatus(requesterEmail, parsedStatus);
        return ResponseEntity.ok(groups);
    }

    /**
     * GET /api/groups/invites
     * Fetch pending invites for the authenticated user
     */
    @GetMapping("/invites")
    public ResponseEntity<?> getPendingInvites(Authentication authentication) {
        String requesterEmail = resolveEmail(authentication);
        if (requesterEmail == null || requesterEmail.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not authenticated"));
        }

        List<ExpenseGroup> invites = expenseGroupRepository
                .findByUserEmailAndStatus(requesterEmail, MembershipStatus.PENDING);
        return ResponseEntity.ok(invites);
    }

    /**
     * POST /api/groups/invite
     * Create a group and invite members with PENDING status
     */
    @PostMapping("/invite")
    public ResponseEntity<?> inviteMembers(@RequestBody GroupInviteRequest request,
                                           Authentication authentication) {
        String requesterEmail = resolveEmail(authentication);
        if (requesterEmail == null || requesterEmail.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not authenticated"));
        }

        String groupName = request != null ? request.getGroupName() : null;
        List<String> emails = request != null ? request.getEmails() : null;

        if (groupName == null || groupName.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "groupName is required"));
        }

        if (emails == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "emails must be a list"));
        }

        Set<String> emailSet = new LinkedHashSet<>();
        for (String emailValue : emails) {
            if (emailValue != null) {
                String cleaned = emailValue.trim().toLowerCase();
                if (!cleaned.isBlank()) {
                    emailSet.add(cleaned);
                }
            }
        }

        if (emailSet.size() < 1) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "At least 1 unique member email is required"));
        }

        List<User> members = new ArrayList<>();
        List<String> missingEmails = new ArrayList<>();

        for (String email : emailSet) {
            Optional<User> userOptional = userRepository.findByEmailIgnoreCase(email);
            if (userOptional.isPresent()) {
                members.add(userOptional.get());
            } else {
                missingEmails.add(email);
            }
        }

        if (!missingEmails.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Some emails do not exist", "missing", missingEmails));
        }

        ExpenseGroup group = new ExpenseGroup();
        group.setGroupName(groupName.trim());
        for (User member : members) {
            GroupMembership membership = new GroupMembership();
            membership.setUser(member);
            membership.setStatus(MembershipStatus.PENDING);
            group.addMembership(membership);
        }

        ExpenseGroup saved = expenseGroupRepository.save(group);

        for (User member : members) {
            groupInviteEmailService.sendInviteEmail(member.getEmail(), group.getGroupName(), saved.getId());
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * POST /api/groups/{groupId}/invite-member
     * Invite a single member by email (creates a placeholder user if missing)
     */
    @PostMapping("/{groupId}/invite-member")
    public ResponseEntity<?> inviteMember(@PathVariable Long groupId,
                                          @RequestBody Map<String, Object> payload,
                                          Authentication authentication) {
        String requesterEmail = resolveEmail(authentication);
        if (requesterEmail == null || requesterEmail.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not authenticated"));
        }

        Optional<User> requesterOptional = userRepository.findByEmailIgnoreCase(requesterEmail);
        if (requesterOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found"));
        }

        Optional<ExpenseGroup> groupOptional = expenseGroupRepository.findById(groupId);
        if (groupOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Group not found"));
        }

        String inviteEmail = payload.get("email") instanceof String value ? value.trim().toLowerCase() : null;
        if (inviteEmail == null || inviteEmail.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "email is required"));
        }

        User invitedUser = userRepository.findByEmailIgnoreCase(inviteEmail)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setEmail(inviteEmail);
                    newUser.setUsername(null);
                    newUser.setPassword(null);
                    newUser.setTotalIncome(0.0);
                    return userRepository.save(newUser);
                });

        Optional<GroupMembership> existingMembership = groupMembershipRepository
                .findByExpenseGroupIdAndUserId(groupId, invitedUser.getId());
        if (existingMembership.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "User already invited or a member"));
        }

        GroupMembership membership = new GroupMembership();
        membership.setUser(invitedUser);
        membership.setExpenseGroup(groupOptional.get());
        membership.setStatus(MembershipStatus.PENDING);
        groupMembershipRepository.save(membership);

        groupInviteEmailService.sendInviteEmail(invitedUser.getEmail(), groupOptional.get().getGroupName(), groupId);

        return ResponseEntity.ok(Map.of("message", "Invitation sent"));
    }

    /**
     * POST /api/groups/{groupId}/expenses
     * Log a group expense by a member of the group
     */
    @PostMapping("/{groupId}/expenses")
    public ResponseEntity<?> createGroupExpense(@PathVariable Long groupId,
                                                @RequestBody Map<String, Object> payload,
                                                Authentication authentication) {
        String requesterEmail = resolveEmail(authentication);
        if (requesterEmail == null || requesterEmail.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not authenticated"));
        }

        Optional<User> payerOptional = userRepository.findByEmailIgnoreCase(requesterEmail);
        if (payerOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found"));
        }

        Optional<ExpenseGroup> groupOptional = expenseGroupRepository.findById(groupId);
        if (groupOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Group not found"));
        }

        User payer = payerOptional.get();
        Optional<GroupMembership> membershipOptional = groupMembershipRepository
                .findByExpenseGroupIdAndUserId(groupId, payer.getId());
        if (membershipOptional.isEmpty() || membershipOptional.get().getStatus() != MembershipStatus.ACCEPTED) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "User is not a member of this group"));
        }

        String description = payload.get("description") instanceof String value ? value.trim() : null;
        Double totalAmount = null;
        Object amountObj = payload.get("totalAmount") != null ? payload.get("totalAmount") : payload.get("amount");
        if (amountObj instanceof Number numberValue) {
            totalAmount = numberValue.doubleValue();
        }
        String dateValue = payload.get("date") instanceof String value ? value.trim() : null;

        if (description == null || description.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "description is required"));
        }
        if (totalAmount == null || totalAmount <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "totalAmount must be greater than 0"));
        }

        GroupExpense expense = new GroupExpense();
        expense.setDescription(description);
        expense.setTotalAmount(totalAmount);
        if (dateValue != null && !dateValue.isBlank()) {
            try {
                expense.setDate(java.time.LocalDate.parse(dateValue));
            } catch (java.time.format.DateTimeParseException ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "date must be in YYYY-MM-DD format"));
            }
        }
        expense.setPayer(payer);
        expense.setExpenseGroup(groupOptional.get());

        GroupExpense saved = groupExpenseRepository.save(expense);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * POST /api/groups/remind
     * Send an email reminder for a group balance
     */
    @PostMapping("/remind")
    public ResponseEntity<?> sendReminder(@RequestBody GroupReminderRequest request,
                                          Authentication authentication) {
        String requesterEmail = resolveEmail(authentication);
        if (requesterEmail == null || requesterEmail.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not authenticated"));
        }

        if (request == null
                || request.getDebtorEmail() == null
                || request.getDebtorEmail().isBlank()
                || request.getCreditorName() == null
                || request.getCreditorName().isBlank()
                || request.getAmountOwed() == null
                || request.getAmountOwed() <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "debtorEmail, creditorName, and amountOwed are required"));
        }

        emailReminderService.sendGroupReminder(
                request.getDebtorEmail().trim(),
                request.getCreditorName().trim(),
                request.getAmountOwed()
        );

        return ResponseEntity.ok(Map.of("message", "Reminder sent"));
    }

    /**
     * POST /api/groups/{groupId}/accept
     * Accept a pending invitation
     */
    @PostMapping("/{groupId}/accept")
    public ResponseEntity<?> acceptInvitation(@PathVariable Long groupId,
                                              Authentication authentication) {
        String requesterEmail = resolveEmail(authentication);
        if (requesterEmail == null || requesterEmail.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not authenticated"));
        }

        Optional<User> userOptional = userRepository.findByEmailIgnoreCase(requesterEmail);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found"));
        }

        Optional<GroupMembership> membershipOptional = groupMembershipRepository
                .findByExpenseGroupIdAndUserId(groupId, userOptional.get().getId());
        if (membershipOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Membership not found"));
        }

        GroupMembership membership = membershipOptional.get();
        membership.setStatus(MembershipStatus.ACCEPTED);
        groupMembershipRepository.save(membership);

        return ResponseEntity.ok(Map.of("message", "Invitation accepted"));
    }

    private String resolveEmail(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return null;
        }
        return userRepository.findByUsername(authentication.getName())
                .map(User::getEmail)
                .orElse(null);
    }
}
