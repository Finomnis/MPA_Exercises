function visualize_matrix(B,lcomp)
% visualize_matrix visualizes an arbitrary matrix
% B     : a matrix
% lcomp : can be set to apply a logarithmic compression to the
%         visualization

if nargin < 2
    lcomp = 0;
end

% absolute value and logarithmic compression
if lcomp > 0
    B = log(1 + lcomp*abs(B));
else
    B = abs(B);
end

% visualization
figure;
imagesc(B);
colorbar;
axis xy;
colormap(1-gray);

end

