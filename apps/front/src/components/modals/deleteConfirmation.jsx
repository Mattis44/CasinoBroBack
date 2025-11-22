import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import PropTypes from 'prop-types';

const ModalDeleteConfirmation = ({ itemTitle, onClick, open, onClose }) => (
    <Dialog
        open={open}
        onClose={onClick}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
    >
        <DialogTitle id="modal-modal-title">Delete {itemTitle} ?</DialogTitle>
        <DialogContent>
            <DialogContentText>
                Are you sure you want to delete this {itemTitle} ? This action cannot be undone.
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button onClick={onClick}>Delete</Button>
        </DialogActions>
    </Dialog>
);

export default ModalDeleteConfirmation;

ModalDeleteConfirmation.propTypes = {
    itemTitle: PropTypes.string,
    onClick: PropTypes.func,
    open: PropTypes.bool,
    onClose: PropTypes.func,
}